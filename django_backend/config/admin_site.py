import os
import csv
import json
from datetime import timedelta, datetime, date
from decimal import Decimal

from django.contrib import admin
from django.urls import path
from django.utils import timezone
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse, HttpResponseRedirect, HttpResponseNotAllowed
from django.contrib import messages
from django.db.models import Sum, Count, F, Q
from django.db import transaction
from django.views.decorators.http import require_POST

from apps.authentication.models import GoalignAccount
from apps.trading.models import Order, Trade, Position, KYCApplication, P2POrder
from apps.wallets.models import WithdrawalRequest, Balance
from apps.ledger.models import LedgerTransaction, LedgerEntry
from apps.audit.models import AuditLog
from apps.ledger.services import post_ledger_transaction


class GoalignSuperAdminSite(admin.AdminSite):
    site_header = "Goalign Super Admin"
    site_title = "Goalign Admin Portal"
    index_title = "Super Admin Control Center & Financial Dashboard"
    index_template = "admin/index.html"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('kyc-queue/', self.admin_view(self.kyc_queue_view), name='kyc_queue'),
            path('withdrawals-queue/', self.admin_view(self.withdrawals_queue_view), name='withdrawals_queue'),
            path('p2p-disputes/', self.admin_view(self.p2p_disputes_view), name='p2p_disputes'),
            path('compliance-reports/', self.admin_view(self.compliance_reports_view), name='compliance_reports'),
            path('compliance-reports/download/<str:report_type>/', self.admin_view(self.compliance_download_view), name='compliance_download'),
            path('investigate/<str:reference_id>/', self.admin_view(self.audit_investigate_view), name='audit_investigate'),
            path('api/kyc-action/', self.admin_view(self.kyc_action_api), name='api_kyc_action'),
            path('api/withdrawal-action/', self.admin_view(self.withdrawal_action_api), name='api_withdrawal_action'),
            path('api/p2p-dispute-action/', self.admin_view(self.p2p_dispute_action_api), name='api_p2p_dispute_action'),
            path('api/user-status-action/', self.admin_view(self.user_status_action_api), name='api_user_status_action'),
            path('api/heartbeat/', self.admin_view(self.heartbeat_api), name='api_heartbeat'),
        ]
        return custom_urls + urls

    def get_app_list(self, request, app_label=None):
        app_list = super().get_app_list(request, app_label=app_label)
        if app_label:
            return app_list

        category_mapping = {
            'AuditLog': 'AUDIT',
            'GoalignAccount': 'AUTHENTICATION',
            'GoalignProfile': 'AUTHENTICATION',
            'User': 'AUTHENTICATION',
            'Group': 'AUTHENTICATION',
            'IdempotencyKey': 'LEDGER',
            'LedgerEntry': 'LEDGER',
            'LedgerTransaction': 'LEDGER',
            'CopyAllocation': 'TRADING & MARKETS',
            'KYCApplication': 'TRADING & MARKETS',
            'OptionPosition': 'TRADING & MARKETS',
            'Order': 'TRADING & MARKETS',
            'P2PAd': 'TRADING & MARKETS',
            'P2POrder': 'TRADING & MARKETS',
            'Position': 'TRADING & MARKETS',
            'Stake': 'TRADING & MARKETS',
            'Trade': 'TRADING & MARKETS',
            'Balance': 'WALLETS',
            'WithdrawalRequest': 'WALLETS',
        }

        grouped = {
            'AUDIT': {'name': 'Audit & Compliance', 'app_label': 'audit', 'app_url': '', 'has_module_perms': True, 'models': [], 'icon': 'shield-alert'},
            'AUTHENTICATION': {'name': 'Authentication & Access', 'app_label': 'authentication', 'app_url': '', 'has_module_perms': True, 'models': [], 'icon': 'users'},
            'LEDGER': {'name': 'Ledger & Reconciliation', 'app_label': 'ledger', 'app_url': '', 'has_module_perms': True, 'models': [], 'icon': 'book-open'},
            'TRADING & MARKETS': {'name': 'Trading & Markets', 'app_label': 'trading', 'app_url': '', 'has_module_perms': True, 'models': [], 'icon': 'trending-up'},
            'WALLETS': {'name': 'Wallets & Treasury', 'app_label': 'wallets', 'app_url': '', 'has_module_perms': True, 'models': [], 'icon': 'wallet'},
        }

        for app in app_list:
            for model in app.get('models', []):
                obj_name = model.get('object_name')
                target_cat = category_mapping.get(obj_name, 'TRADING & MARKETS')
                if target_cat in grouped:
                    # Avoid duplicates
                    if not any(m.get('object_name') == obj_name for m in grouped[target_cat]['models']):
                        grouped[target_cat]['models'].append(model)

        for cat in grouped.values():
            cat['models'].sort(key=lambda x: x['name'])

        return [cat for cat in grouped.values() if cat['models']]

    def each_context(self, request):
        context = super().each_context(request)
        try:
            context['metrics'] = self.get_dashboard_metrics()
        except Exception:
            context['metrics'] = {}
        return context

    def get_dashboard_metrics(self):
        now = timezone.now()
        days_30 = now - timedelta(days=30)
        days_1 = now - timedelta(days=1)

        # 1. Registered Users
        total_users = GoalignAccount.objects.count()
        users_30d = GoalignAccount.objects.filter(created_at__gte=days_30).count()

        # 2. Active Traders (Users who placed an order or opened a position in last 30d)
        active_traders = Order.objects.filter(created_at__gte=days_30).values('user_id').distinct().count()
        if active_traders == 0 and total_users > 0:
            active_traders = GoalignAccount.objects.filter(is_admin=False).count()

        # 3. Total Trading Volume
        vol_agg = Trade.objects.aggregate(v=Sum(F('amount') * F('price')))['v']
        total_volume = Decimal(str(vol_agg)) if vol_agg is not None else Decimal('0.00')

        vol_24h_agg = Trade.objects.filter(created_at__gte=days_1).aggregate(v=Sum(F('amount') * F('price')))['v']
        vol_24h = Decimal(str(vol_24h_agg)) if vol_24h_agg is not None else Decimal('0.00')

        # 4. Deposits vs Withdrawals
        dep_agg = LedgerEntry.objects.filter(account_type='system_deposits', direction='debit').aggregate(s=Sum('amount'))['s']
        total_deposits = Decimal(str(dep_agg)) if dep_agg is not None else Decimal('0.00')

        wd_agg = WithdrawalRequest.objects.filter(status='completed').aggregate(s=Sum('amount'))['s']
        total_withdrawals = Decimal(str(wd_agg)) if wd_agg is not None else Decimal('0.00')

        # 5. Pending Withdrawal Requests
        pending_wds_qs = WithdrawalRequest.objects.filter(status='pending')
        pending_wds_count = pending_wds_qs.count()
        pending_wds_sum = pending_wds_qs.aggregate(s=Sum('amount'))['s']
        pending_wds_amount = Decimal(str(pending_wds_sum)) if pending_wds_sum is not None else Decimal('0.00')

        # 6. Pending KYC Applications
        pending_kyc_count = GoalignAccount.objects.filter(kyc_status='pending').count()
        total_kyc_submissions = KYCApplication.objects.count()

        # 7. Platform Revenue (Trading fees + protocol cuts)
        rev_agg = Trade.objects.aggregate(fees=Sum('fee'))['fees']
        platform_revenue = Decimal(str(rev_agg)) if rev_agg is not None else Decimal('0.00')

        # 8. Open Orders and Active Positions
        open_orders = Order.objects.filter(status='open').count()
        active_positions = Position.objects.filter(status='open').count()

        # 9. P2P Disputes Queue
        disputed_p2p_count = P2POrder.objects.filter(status='disputed').count()

        return {
            'total_users': total_users,
            'users_30d': users_30d,
            'active_traders': active_traders,
            'total_volume': f"{total_volume:,.2f}",
            'vol_24h': f"{vol_24h:,.2f}",
            'total_deposits': f"{total_deposits:,.2f}",
            'total_withdrawals': f"{total_withdrawals:,.2f}",
            'pending_wds_count': pending_wds_count,
            'pending_wds_amount': f"{pending_wds_amount:,.2f}",
            'pending_kyc_count': pending_kyc_count,
            'total_kyc_submissions': total_kyc_submissions,
            'disputed_p2p_count': disputed_p2p_count,
            'platform_revenue': f"{platform_revenue:,.4f}",
            'open_orders': open_orders,
            'active_positions': active_positions,
            'total_risk_exposure': open_orders + active_positions,
        }

    def get_analytics_charts_data(self):
        now = timezone.now()
        labels = []
        volume_data = []
        revenue_data = []
        user_growth_data = []
        deposit_data = []
        withdrawal_data = []

        cumulative_users = 0
        all_accounts = list(GoalignAccount.objects.order_by('created_at').values('created_at'))

        # Aggregate daily buckets for past 7 days
        for i in range(6, -1, -1):
            day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            date_label = day_start.strftime('%b %d')
            labels.append(date_label)

            # Daily Volume
            v = Trade.objects.filter(created_at__gte=day_start, created_at__lt=day_end).aggregate(
                vol=Sum(F('amount') * F('price'))
            )['vol'] or Decimal('0.00')
            volume_data.append(float(v))

            # Daily Revenue
            r = Trade.objects.filter(created_at__gte=day_start, created_at__lt=day_end).aggregate(
                fee=Sum('fee')
            )['fee'] or Decimal('0.00')
            revenue_data.append(float(r))

            # Daily Deposits
            d = LedgerEntry.objects.filter(
                account_type='system_deposits', direction='debit',
                created_at__gte=day_start, created_at__lt=day_end
            ).aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
            deposit_data.append(float(d))

            # Daily Withdrawals
            w = WithdrawalRequest.objects.filter(
                status='completed',
                created_at__gte=day_start, created_at__lt=day_end
            ).aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
            withdrawal_data.append(float(w))

            # Cumulative Users
            u_count = sum(1 for a in all_accounts if a['created_at'] and a['created_at'] <= day_end)
            user_growth_data.append(u_count if u_count > 0 else len(all_accounts))

        # KYC distribution
        kyc_verified = GoalignAccount.objects.filter(kyc_status='verified').count()
        kyc_pending = GoalignAccount.objects.filter(kyc_status='pending').count()
        kyc_unverified = GoalignAccount.objects.filter(Q(kyc_status='unverified') | Q(kyc_status='rejected')).count()

        return {
            'labels': labels,
            'volume_data': volume_data,
            'revenue_data': revenue_data,
            'user_growth_data': user_growth_data,
            'deposit_data': deposit_data,
            'withdrawal_data': withdrawal_data,
            'kyc_distribution': {
                'verified': kyc_verified,
                'pending': kyc_pending,
                'unverified': kyc_unverified
            }
        }

    def index(self, request, extra_context=None):
        extra_context = extra_context or {}
        
        # 1. Financial & Operational KPIs
        metrics = self.get_dashboard_metrics()
        extra_context['metrics'] = metrics

        # 2. Charts Data (JSON serialized for Chart.js)
        charts_data = self.get_analytics_charts_data()
        extra_context['charts_data_json'] = json.dumps(charts_data)

        # 3. Operational Queues for Quick Actions
        extra_context['pending_kyc_list'] = KYCApplication.objects.select_related('user').filter(
            user__kyc_status='pending'
        ).order_by('-created_at')[:8]

        extra_context['pending_withdrawals_list'] = WithdrawalRequest.objects.filter(
            status='pending'
        ).order_by('-created_at')[:8]

        # 4. Recent Audit & Activity Stream
        extra_context['recent_audit_logs'] = AuditLog.objects.select_related('actor').order_by('-timestamp')[:8]
        extra_context['recent_ledger_txs'] = LedgerTransaction.objects.order_by('-created_at')[:8]

        # 5. Pending Notifications Summary
        pending_alerts = []
        if metrics.get('disputed_p2p_count', 0) > 0:
            pending_alerts.append({
                'level': 'danger',
                'title': f"{metrics['disputed_p2p_count']} P2P Escrow Dispute{'s' if metrics['disputed_p2p_count'] > 1 else ''}",
                'desc': "Peer-to-peer orders flagged for administrative arbitration.",
                'link': '/admin/p2p-disputes/?status=disputed'
            })
        if metrics['pending_wds_count'] > 0:
            pending_alerts.append({
                'level': 'warning',
                'title': f"{metrics['pending_wds_count']} Pending Withdrawal{'s' if metrics['pending_wds_count'] > 1 else ''}",
                'desc': f"Total {metrics['pending_wds_amount']} USDT requires review.",
                'link': '/admin/withdrawals-queue/'
            })
        if metrics['pending_kyc_count'] > 0:
            pending_alerts.append({
                'level': 'info',
                'title': f"{metrics['pending_kyc_count']} Pending KYC Application{'s' if metrics['pending_kyc_count'] > 1 else ''}",
                'desc': "Identity documents awaiting operator verification.",
                'link': '/admin/kyc-queue/'
            })
        extra_context['operational_alerts'] = pending_alerts

        return super().index(request, extra_context=extra_context)

    # --------------------------------------------------------------------------
    # Custom Queue Views
    # --------------------------------------------------------------------------
    def kyc_queue_view(self, request):
        applications = KYCApplication.objects.select_related('user').order_by('-created_at')
        status_filter = request.GET.get('status', 'pending')
        if status_filter != 'all':
            applications = applications.filter(user__kyc_status=status_filter)

        context = {
            **self.each_context(request),
            'title': 'KYC Review Queue',
            'applications': applications,
            'status_filter': status_filter,
            'pending_count': GoalignAccount.objects.filter(kyc_status='pending').count(),
            'verified_count': GoalignAccount.objects.filter(kyc_status='verified').count(),
            'rejected_count': GoalignAccount.objects.filter(kyc_status='rejected').count(),
        }
        return render(request, 'admin/kyc_queue.html', context)

    def withdrawals_queue_view(self, request):
        status_filter = request.GET.get('status', 'pending')
        withdrawals = WithdrawalRequest.objects.order_by('-created_at')
        if status_filter != 'all':
            withdrawals = withdrawals.filter(status=status_filter)

        context = {
            **self.each_context(request),
            'title': 'Withdrawal Approvals Queue',
            'withdrawals': withdrawals,
            'status_filter': status_filter,
            'pending_count': WithdrawalRequest.objects.filter(status='pending').count(),
            'completed_count': WithdrawalRequest.objects.filter(status='completed').count(),
            'rejected_count': WithdrawalRequest.objects.filter(status='rejected').count(),
        }
        return render(request, 'admin/withdrawals_queue.html', context)

    def p2p_disputes_view(self, request):
        status_filter = request.GET.get('status', 'disputed' if P2POrder.objects.filter(status='disputed').exists() else 'all')
        orders = P2POrder.objects.select_related('buyer', 'seller', 'ad').order_by('-created_at')
        if status_filter != 'all':
            orders = orders.filter(status=status_filter)

        context = {
            **self.each_context(request),
            'title': 'P2P Dispute Management Console',
            'orders': orders,
            'status_filter': status_filter,
            'disputed_count': P2POrder.objects.filter(status='disputed').count(),
            'pending_count': P2POrder.objects.filter(status='pending').count(),
            'paid_count': P2POrder.objects.filter(status='paid').count(),
            'completed_count': P2POrder.objects.filter(status='completed').count(),
            'canceled_count': P2POrder.objects.filter(status='canceled').count(),
            'all_count': P2POrder.objects.count(),
        }
        return render(request, 'admin/p2p_disputes.html', context)

    def compliance_reports_view(self, request):
        now = timezone.now()
        days_30 = now - timedelta(days=30)

        context = {
            **self.each_context(request),
            'title': 'Compliance & Regulatory Audit Hub',
            'ledger_count': LedgerEntry.objects.count(),
            'ledger_30d': LedgerEntry.objects.filter(created_at__gte=days_30).count(),
            'audit_count': AuditLog.objects.count(),
            'audit_30d': AuditLog.objects.filter(timestamp__gte=days_30).count(),
            'trades_count': Trade.objects.count(),
            'trades_30d': Trade.objects.filter(created_at__gte=days_30).count(),
            'balances_count': Balance.objects.count(),
            'withdrawals_count': WithdrawalRequest.objects.count(),
            'p2p_count': P2POrder.objects.count(),
            'default_start_date': (now - timedelta(days=30)).strftime('%Y-%m-%d'),
            'default_end_date': now.strftime('%Y-%m-%d'),
        }
        return render(request, 'admin/compliance_reports.html', context)

    def compliance_download_view(self, request, report_type):
        start_date_str = request.GET.get('start_date')
        end_date_str = request.GET.get('end_date')

        start_dt = None
        end_dt = None
        if start_date_str:
            try:
                start_dt = timezone.make_aware(datetime.strptime(start_date_str, '%Y-%m-%d'))
            except Exception:
                pass
        if end_date_str:
            try:
                end_dt = timezone.make_aware(datetime.strptime(end_date_str, '%Y-%m-%d')).replace(hour=23, minute=59, second=59)
            except Exception:
                pass

        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        response = HttpResponse(content_type='text/csv; charset=utf-8')

        if report_type == 'ledger':
            response['Content-Disposition'] = f'attachment; filename="goalign_ledger_journal_{timestamp}.csv"'
            writer = csv.writer(response)
            writer.writerow(['ENTRY_ID', 'TX_ID', 'TRANSACTION_TYPE', 'REFERENCE_ID', 'TX_STATUS', 'USER_EMAIL', 'ACCOUNT_TYPE', 'ASSET', 'DIRECTION', 'AMOUNT', 'CREATED_AT'])
            qs = LedgerEntry.objects.select_related('ledger_transaction', 'user').order_by('-created_at')
            if start_dt:
                qs = qs.filter(created_at__gte=start_dt)
            if end_dt:
                qs = qs.filter(created_at__lte=end_dt)
            for e in qs:
                tx = e.ledger_transaction
                user_email = e.user.email if e.user and hasattr(e.user, 'email') else (e.user.username if e.user else 'SYSTEM')
                writer.writerow([
                    e.id,
                    tx.id if tx else '',
                    tx.transaction_type if tx else '',
                    tx.reference_id if tx else '',
                    tx.status if tx else '',
                    user_email,
                    e.account_type,
                    e.asset,
                    e.direction.upper(),
                    f"{e.amount:.8f}",
                    e.created_at.strftime('%Y-%m-%d %H:%M:%S UTC') if e.created_at else ''
                ])

        elif report_type == 'audit':
            response['Content-Disposition'] = f'attachment; filename="goalign_regulatory_audit_trail_{timestamp}.csv"'
            writer = csv.writer(response)
            writer.writerow(['AUDIT_ID', 'TIMESTAMP', 'ACTOR_EMAIL', 'ACTION', 'TARGET_TYPE', 'TARGET_IDENTIFIER', 'REQUEST_ID', 'METADATA'])
            qs = AuditLog.objects.select_related('actor').order_by('-timestamp')
            if start_dt:
                qs = qs.filter(timestamp__gte=start_dt)
            if end_dt:
                qs = qs.filter(timestamp__lte=end_dt)
            for a in qs:
                actor_email = a.actor.email if a.actor and hasattr(a.actor, 'email') else (a.actor.username if a.actor else 'SYSTEM')
                meta_json = json.dumps(a.metadata, ensure_ascii=False) if a.metadata else ''
                writer.writerow([
                    a.id,
                    a.timestamp.strftime('%Y-%m-%d %H:%M:%S UTC') if a.timestamp else '',
                    actor_email,
                    a.action,
                    a.target_type,
                    a.target_identifier,
                    a.request_id or '',
                    meta_json
                ])

        elif report_type == 'trades':
            response['Content-Disposition'] = f'attachment; filename="goalign_trades_reconciliation_{timestamp}.csv"'
            writer = csv.writer(response)
            writer.writerow(['TRADE_ID', 'ORDER_ID', 'USER_EMAIL', 'SYMBOL', 'SIDE', 'PRICE', 'AMOUNT', 'FEE', 'CREATED_AT'])
            qs = Trade.objects.select_related('user', 'order').order_by('-created_at')
            if start_dt:
                qs = qs.filter(created_at__gte=start_dt)
            if end_dt:
                qs = qs.filter(created_at__lte=end_dt)
            for t in qs:
                user_email = t.user.email if t.user else ''
                writer.writerow([
                    t.id,
                    t.order_id or '',
                    user_email,
                    t.symbol,
                    t.side.upper(),
                    f"{t.price:.8f}",
                    f"{t.amount:.8f}",
                    f"{t.fee:.8f}",
                    t.created_at.strftime('%Y-%m-%d %H:%M:%S UTC') if t.created_at else ''
                ])

        elif report_type == 'balances':
            response['Content-Disposition'] = f'attachment; filename="goalign_balances_snapshot_{timestamp}.csv"'
            writer = csv.writer(response)
            writer.writerow(['BALANCE_ID', 'USER_EMAIL', 'ASSET', 'ACCOUNT_TYPE', 'TOTAL', 'AVAILABLE', 'LOCKED', 'UPDATED_AT'])
            qs = Balance.objects.select_related('user').order_by('asset', 'account_type')
            for b in qs:
                user_email = b.user.email if b.user and hasattr(b.user, 'email') else (b.user.username if b.user else '')
                writer.writerow([
                    b.id,
                    user_email,
                    b.asset,
                    b.account_type,
                    f"{b.total:.8f}",
                    f"{b.available:.8f}",
                    f"{b.locked:.8f}",
                    b.updated_at.strftime('%Y-%m-%d %H:%M:%S UTC') if b.updated_at else ''
                ])

        elif report_type == 'withdrawals':
            response['Content-Disposition'] = f'attachment; filename="goalign_withdrawals_reconciliation_{timestamp}.csv"'
            writer = csv.writer(response)
            writer.writerow(['WITHDRAWAL_UUID', 'USER_EMAIL', 'ASSET', 'AMOUNT', 'NETWORK', 'ADDRESS', 'STATUS', 'PROVIDER_TXID', 'CREATED_AT', 'UPDATED_AT'])
            qs = WithdrawalRequest.objects.select_related('user').order_by('-created_at')
            if start_dt:
                qs = qs.filter(created_at__gte=start_dt)
            if end_dt:
                qs = qs.filter(created_at__lte=end_dt)
            for w in qs:
                user_email = w.user.email if w.user and hasattr(w.user, 'email') else (w.user.username if w.user else '')
                writer.writerow([
                    str(w.withdrawal_uuid),
                    user_email,
                    w.asset,
                    f"{w.amount:.8f}",
                    w.network,
                    w.address,
                    w.status.upper(),
                    w.provider_txid or '',
                    w.created_at.strftime('%Y-%m-%d %H:%M:%S UTC') if w.created_at else '',
                    w.updated_at.strftime('%Y-%m-%d %H:%M:%S UTC') if w.updated_at else ''
                ])

        elif report_type == 'p2p':
            response['Content-Disposition'] = f'attachment; filename="goalign_p2p_orders_{timestamp}.csv"'
            writer = csv.writer(response)
            writer.writerow(['ORDER_ID', 'BUYER_EMAIL', 'SELLER_EMAIL', 'ASSET', 'CRYPTO_AMOUNT', 'FIAT', 'FIAT_AMOUNT', 'PRICE', 'PAYMENT_METHOD', 'STATUS', 'CREATED_AT', 'UPDATED_AT'])
            qs = P2POrder.objects.select_related('buyer', 'seller').order_by('-created_at')
            if start_dt:
                qs = qs.filter(created_at__gte=start_dt)
            if end_dt:
                qs = qs.filter(created_at__lte=end_dt)
            for p in qs:
                buyer_email = p.buyer.email if p.buyer else ''
                seller_email = p.seller.email if p.seller else ''
                writer.writerow([
                    p.id,
                    buyer_email,
                    seller_email,
                    p.asset,
                    f"{p.crypto_amount:.8f}",
                    p.fiat,
                    f"{p.fiat_amount:.8f}",
                    f"{p.price:.8f}",
                    p.payment_method,
                    p.status.upper(),
                    p.created_at.strftime('%Y-%m-%d %H:%M:%S UTC') if p.created_at else '',
                    p.updated_at.strftime('%Y-%m-%d %H:%M:%S UTC') if p.updated_at else ''
                ])
        else:
            messages.error(request, f"Unknown report type: {report_type}")
            return redirect('/admin/compliance-reports/')

        return response

    def audit_investigate_view(self, request, reference_id):
        # Retrieve ledger transaction and its entries
        ledger_tx = LedgerTransaction.objects.filter(reference_id=reference_id).first()
        if not ledger_tx:
            try:
                ledger_tx = LedgerTransaction.objects.get(id=reference_id)
            except Exception:
                ledger_tx = None

        entries = []
        if ledger_tx:
            entries = LedgerEntry.objects.filter(ledger_transaction=ledger_tx).order_by('created_at')

        # Related audit logs
        logs = AuditLog.objects.filter(
            Q(target_identifier=reference_id) | Q(metadata__icontains=reference_id)
        ).order_by('-timestamp')

        context = {
            **self.each_context(request),
            'title': f'Transaction Investigation: {reference_id}',
            'reference_id': reference_id,
            'ledger_tx': ledger_tx,
            'entries': entries,
            'logs': logs,
        }
        return render(request, 'admin/transaction_investigate.html', context)

    # --------------------------------------------------------------------------
    # Operational Action APIs (CSRF & Staff-Protected)
    # --------------------------------------------------------------------------
    def kyc_action_api(self, request):
        if request.method != 'POST':
            return HttpResponseNotAllowed(['POST'])
        app_id = request.POST.get('application_id')
        action = request.POST.get('action') # 'approve' | 'reject'
        reason = request.POST.get('reason', '')

        app = get_object_or_404(KYCApplication, id=app_id)
        account = app.user

        if action == 'approve':
            account.kyc_status = 'verified'
            account.save(update_fields=['kyc_status'])
            AuditLog.objects.create(
                actor=request.user,
                action='KYC_APPROVED',
                target_type='GoalignAccount',
                target_identifier=str(account.id),
                metadata={'email': account.email, 'full_name': app.full_name}
            )
            messages.success(request, f"KYC Application for {account.email} approved successfully.")
        elif action == 'reject':
            account.kyc_status = 'rejected'
            account.save(update_fields=['kyc_status'])
            AuditLog.objects.create(
                actor=request.user,
                action='KYC_REJECTED',
                target_type='GoalignAccount',
                target_identifier=str(account.id),
                metadata={'email': account.email, 'reason': reason}
            )
            messages.warning(request, f"KYC Application for {account.email} rejected. Reason: {reason or 'Incomplete documentation'}")

        next_url = request.POST.get('next', '/admin/kyc-queue/')
        return redirect(next_url)

    def withdrawal_action_api(self, request):
        if request.method != 'POST':
            return HttpResponseNotAllowed(['POST'])
        wd_uuid = request.POST.get('withdrawal_uuid')
        action = request.POST.get('action') # 'approve' | 'reject'
        reason = request.POST.get('reason', '')

        wd = get_object_or_404(WithdrawalRequest, withdrawal_uuid=wd_uuid)

        if wd.status != 'pending':
            messages.error(request, f"Withdrawal {wd_uuid} is already {wd.status}.")
            return redirect(request.POST.get('next', '/admin/withdrawals-queue/'))

        if action == 'approve':
            provider_tx = f"TX_ONCHAIN_{wd_uuid[:8].upper()}_{timezone.now().strftime('%s')}"
            wd.status = 'completed'
            wd.provider_txid = provider_tx
            wd.save(update_fields=['status', 'provider_txid', 'updated_at'])

            AuditLog.objects.create(
                actor=request.user,
                action='WITHDRAWAL_APPROVED',
                target_type='WithdrawalRequest',
                target_identifier=str(wd.withdrawal_uuid),
                metadata={'amount': str(wd.amount), 'asset': wd.asset, 'txid': provider_tx}
            )
            messages.success(request, f"Withdrawal {wd.amount} {wd.asset} approved. TxID: {provider_tx}")

        elif action == 'reject':
            with transaction.atomic():
                wd.status = 'rejected'
                wd.save(update_fields=['status', 'updated_at'])

                # Financial refund via double-entry ledger
                post_ledger_transaction(
                    reference_id=f"WD_REJECT_REFUND_{wd.withdrawal_uuid}",
                    transaction_type='WITHDRAWAL_REJECT_REFUND',
                    description=f"Automated refund for rejected withdrawal {wd.withdrawal_uuid}. Reason: {reason}",
                    entries=[
                        {'user': wd.user, 'account_type': 'spot', 'asset': wd.asset, 'direction': 'credit', 'amount': wd.amount},
                        {'user': None, 'account_type': 'system_withdrawals', 'asset': wd.asset, 'direction': 'debit', 'amount': wd.amount}
                    ]
                )

                AuditLog.objects.create(
                    actor=request.user,
                    action='WITHDRAWAL_REJECTED',
                    target_type='WithdrawalRequest',
                    target_identifier=str(wd.withdrawal_uuid),
                    metadata={'amount': str(wd.amount), 'asset': wd.asset, 'reason': reason}
                )
            messages.warning(request, f"Withdrawal {wd.amount} {wd.asset} rejected. Funds unlocked & refunded to user spot wallet.")

        return redirect(request.POST.get('next', '/admin/withdrawals-queue/'))

    def user_status_action_api(self, request):
        if request.method != 'POST':
            return HttpResponseNotAllowed(['POST'])
        user_id = request.POST.get('user_id')
        action = request.POST.get('action') # 'suspend' | 'activate'
        account = get_object_or_404(GoalignAccount, id=user_id)

        # Also find or sync Django User if exists
        from django.contrib.auth.models import User
        auth_user = User.objects.filter(Q(email=account.email) | Q(username=f"firebase_{account.firebase_uid[:20]}")).first()

        if action == 'suspend':
            if auth_user:
                auth_user.is_active = False
                auth_user.save(update_fields=['is_active'])
            AuditLog.objects.create(
                actor=request.user,
                action='USER_SUSPENDED',
                target_type='GoalignAccount',
                target_identifier=str(account.id),
                metadata={'email': account.email}
            )
            messages.error(request, f"User account {account.email} has been suspended.")
        elif action == 'activate':
            if auth_user:
                auth_user.is_active = True
                auth_user.save(update_fields=['is_active'])
            AuditLog.objects.create(
                actor=request.user,
                action='USER_ACTIVATED',
                target_type='GoalignAccount',
                target_identifier=str(account.id),
                metadata={'email': account.email}
            )
            messages.success(request, f"User account {account.email} has been activated.")

        return redirect(request.POST.get('next', '/admin/authentication/goalignaccount/'))

    def p2p_dispute_action_api(self, request):
        if request.method != 'POST':
            return HttpResponseNotAllowed(['POST'])
        order_id = request.POST.get('order_id')
        action = request.POST.get('action')  # 'release_to_buyer' | 'refund_to_seller'
        reason = request.POST.get('reason', '').strip()

        order = get_object_or_404(P2POrder.objects.select_related('buyer', 'seller'), id=order_id)

        if order.status not in ['disputed', 'paid', 'pending']:
            messages.error(request, f"Order #{order_id} is already '{order.status}'. Cannot perform arbitration.")
            return redirect(request.POST.get('next', '/admin/p2p-disputes/'))

        with transaction.atomic():
            if action == 'release_to_buyer':
                order.status = 'completed'
                order.save(update_fields=['status', 'updated_at'])

                AuditLog.objects.create(
                    actor=request.user,
                    action='P2P_DISPUTE_RELEASED_TO_BUYER',
                    target_type='P2POrder',
                    target_identifier=str(order.id),
                    metadata={
                        'action': 'release_to_buyer',
                        'order_id': order.id,
                        'asset': order.asset,
                        'crypto_amount': str(order.crypto_amount),
                        'buyer_id': order.buyer.id if order.buyer else None,
                        'buyer_email': order.buyer.email if order.buyer else None,
                        'seller_id': order.seller.id if order.seller else None,
                        'seller_email': order.seller.email if order.seller else None,
                        'reason': reason or 'Admin arbitration release to buyer'
                    }
                )
                messages.success(request, f"Dispute resolved: Order #{order.id} escrow released to Buyer ({order.buyer.email if order.buyer else 'Buyer'}). Reason: {reason or 'Arbitration complete'}")

            elif action == 'refund_to_seller':
                order.status = 'canceled'
                order.save(update_fields=['status', 'updated_at'])

                AuditLog.objects.create(
                    actor=request.user,
                    action='P2P_DISPUTE_REFUNDED_TO_SELLER',
                    target_type='P2POrder',
                    target_identifier=str(order.id),
                    metadata={
                        'action': 'refund_to_seller',
                        'order_id': order.id,
                        'asset': order.asset,
                        'crypto_amount': str(order.crypto_amount),
                        'buyer_id': order.buyer.id if order.buyer else None,
                        'buyer_email': order.buyer.email if order.buyer else None,
                        'seller_id': order.seller.id if order.seller else None,
                        'seller_email': order.seller.email if order.seller else None,
                        'reason': reason or 'Admin arbitration refund to seller'
                    }
                )
                messages.warning(request, f"Dispute resolved: Order #{order.id} escrow refunded to Seller ({order.seller.email if order.seller else 'Seller'}). Reason: {reason or 'Arbitration refund'}")

        return redirect(request.POST.get('next', '/admin/p2p-disputes/'))

    def heartbeat_api(self, request):
        metrics = self.get_dashboard_metrics()
        
        recent_wds = list(WithdrawalRequest.objects.filter(status='pending').order_by('-created_at').values('withdrawal_uuid', 'amount', 'asset', 'created_at')[:3])
        recent_disputes = list(P2POrder.objects.filter(status='disputed').order_by('-updated_at').values('id', 'crypto_amount', 'asset', 'updated_at')[:3])
        recent_kyc = list(GoalignAccount.objects.filter(kyc_status='pending').order_by('-updated_at').values('id', 'email', 'updated_at')[:3])

        return JsonResponse({
            'status': 'ok',
            'timestamp': timezone.now().isoformat(),
            'metrics': metrics,
            'alerts': {
                'pending_wds': [
                    {'id': str(w['withdrawal_uuid']), 'amount': f"{w['amount']} {w['asset']}", 'created_at': w['created_at'].isoformat() if w['created_at'] else ''}
                    for w in recent_wds
                ],
                'disputed_p2p': [
                    {'id': d['id'], 'amount': f"{d['crypto_amount']} {d['asset']}", 'updated_at': d['updated_at'].isoformat() if d['updated_at'] else ''}
                    for d in recent_disputes
                ],
                'pending_kyc': [
                    {'id': k['id'], 'email': k['email'], 'updated_at': k['updated_at'].isoformat() if k['updated_at'] else ''}
                    for k in recent_kyc
                ],
            }
        })


# Instantiate global custom admin site with standard 'admin' namespace
super_admin_site = GoalignSuperAdminSite(name='admin')
