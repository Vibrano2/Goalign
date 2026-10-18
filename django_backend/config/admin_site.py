import os
import json
from datetime import timedelta
from decimal import Decimal

from django.contrib import admin
from django.urls import path
from django.utils import timezone
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponseRedirect
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
            path('investigate/<str:reference_id>/', self.admin_view(self.audit_investigate_view), name='audit_investigate'),
            path('api/kyc-action/', self.admin_view(self.kyc_action_api), name='api_kyc_action'),
            path('api/withdrawal-action/', self.admin_view(self.withdrawal_action_api), name='api_withdrawal_action'),
            path('api/user-status-action/', self.admin_view(self.user_status_action_api), name='api_user_status_action'),
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
    @require_POST
    def kyc_action_api(self, request):
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

    @require_POST
    def withdrawal_action_api(self, request):
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

    @require_POST
    def user_status_action_api(self, request):
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


# Instantiate global custom admin site with standard 'admin' namespace
super_admin_site = GoalignSuperAdminSite(name='admin')
