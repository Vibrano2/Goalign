from django.urls import path
from .views import (
    TradeOrderView,
    FuturesOpenView, FuturesPositionsView, FuturesCloseView,
    OptionsChainView, OptionsTradeView, OptionsPositionsView,
    P2PSeedView, P2PAdsView, P2POrderView,
    CopyTradingMastersView, CopyTradingAllocationsView, CopyTradingCopyView, CopyTradingStopView,
    EarnSubscribeView, EarnSubscriptionsView, EarnRedeemView,
    InvestQuantifyPlansView, InvestQuantifyBuyView, InvestPledgesView, InvestPledgeView, InvestRedeemView,
    KYCStatusView, KYCRequestView,
    VIPStatusView, VIPUpgradeView,
    AdminUsersView, AdminWithdrawalsView, AdminWithdrawalActionView, AdminFundUserView, AdminUserUpdateView
)

urlpatterns = [
    # Spot Trading
    path('trade/order', TradeOrderView.as_view(), name='trade_order'),
    path('trade/order/', TradeOrderView.as_view(), name='trade_order_slash'),
    path('trade/orders/<str:firebase_uid>', TradeOrderView.as_view(), name='trade_orders'),
    path('trade/orders/<str:firebase_uid>/', TradeOrderView.as_view(), name='trade_orders_slash'),

    # Futures
    path('futures/open', FuturesOpenView.as_view(), name='futures_open'),
    path('futures/open/', FuturesOpenView.as_view(), name='futures_open_slash'),
    path('futures/close', FuturesCloseView.as_view(), name='futures_close'),
    path('futures/close/', FuturesCloseView.as_view(), name='futures_close_slash'),
    path('futures/positions/<str:firebase_uid>', FuturesPositionsView.as_view(), name='futures_positions'),
    path('futures/positions/<str:firebase_uid>/', FuturesPositionsView.as_view(), name='futures_positions_slash'),

    # Options
    path('options/chain/<str:symbol>', OptionsChainView.as_view(), name='options_chain'),
    path('options/chain/<str:symbol>/', OptionsChainView.as_view(), name='options_chain_slash'),
    path('options/trade', OptionsTradeView.as_view(), name='options_trade'),
    path('options/trade/', OptionsTradeView.as_view(), name='options_trade_slash'),
    path('options/positions/<str:firebase_uid>', OptionsPositionsView.as_view(), name='options_positions'),
    path('options/positions/<str:firebase_uid>/', OptionsPositionsView.as_view(), name='options_positions_slash'),

    # P2P
    path('p2p/seed', P2PSeedView.as_view(), name='p2p_seed'),
    path('p2p/seed/', P2PSeedView.as_view(), name='p2p_seed_slash'),
    path('p2p/ads', P2PAdsView.as_view(), name='p2p_ads'),
    path('p2p/ads/', P2PAdsView.as_view(), name='p2p_ads_slash'),
    path('p2p/order', P2POrderView.as_view(), name='p2p_order'),
    path('p2p/order/', P2POrderView.as_view(), name='p2p_order_slash'),
    path('p2p/orders/<str:firebase_uid>', P2POrderView.as_view(), name='p2p_user_orders'),
    path('p2p/orders/<str:firebase_uid>/', P2POrderView.as_view(), name='p2p_user_orders_slash'),

    # Copy Trading
    path('copytrade/masters', CopyTradingMastersView.as_view(), name='copytrade_masters'),
    path('copytrade/masters/', CopyTradingMastersView.as_view(), name='copytrade_masters_slash'),
    path('copytrade/allocations/<str:firebase_uid>', CopyTradingAllocationsView.as_view(), name='copytrade_allocations'),
    path('copytrade/allocations/<str:firebase_uid>/', CopyTradingAllocationsView.as_view(), name='copytrade_allocations_slash'),
    path('copytrade/copy', CopyTradingCopyView.as_view(), name='copytrade_copy'),
    path('copytrade/copy/', CopyTradingCopyView.as_view(), name='copytrade_copy_slash'),
    path('copytrade/stop', CopyTradingStopView.as_view(), name='copytrade_stop'),
    path('copytrade/stop/', CopyTradingStopView.as_view(), name='copytrade_stop_slash'),

    # Earn & Staking
    path('earn/subscribe', EarnSubscribeView.as_view(), name='earn_subscribe'),
    path('earn/subscribe/', EarnSubscribeView.as_view(), name='earn_subscribe_slash'),
    path('earn/subscriptions/<str:firebase_uid>', EarnSubscriptionsView.as_view(), name='earn_subscriptions'),
    path('earn/subscriptions/<str:firebase_uid>/', EarnSubscriptionsView.as_view(), name='earn_subscriptions_slash'),
    path('earn/redeem', EarnRedeemView.as_view(), name='earn_redeem'),
    path('earn/redeem/', EarnRedeemView.as_view(), name='earn_redeem_slash'),

    # Invest / Quantify
    path('invest/quantify-plans', InvestQuantifyPlansView.as_view(), name='invest_quantify_plans'),
    path('invest/quantify-plans/', InvestQuantifyPlansView.as_view(), name='invest_quantify_plans_slash'),
    path('invest/quantify/buy', InvestQuantifyBuyView.as_view(), name='invest_quantify_buy'),
    path('invest/quantify/buy/', InvestQuantifyBuyView.as_view(), name='invest_quantify_buy_slash'),
    path('invest/pledges/<str:firebase_uid>', InvestPledgesView.as_view(), name='invest_pledges'),
    path('invest/pledges/<str:firebase_uid>/', InvestPledgesView.as_view(), name='invest_pledges_slash'),
    path('invest/pledge', InvestPledgeView.as_view(), name='invest_pledge'),
    path('invest/pledge/', InvestPledgeView.as_view(), name='invest_pledge_slash'),
    path('invest/redeem', InvestRedeemView.as_view(), name='invest_redeem'),
    path('invest/redeem/', InvestRedeemView.as_view(), name='invest_redeem_slash'),

    # KYC
    path('kyc/status/<str:firebase_uid>', KYCStatusView.as_view(), name='kyc_status'),
    path('kyc/status/<str:firebase_uid>/', KYCStatusView.as_view(), name='kyc_status_slash'),
    path('kyc/request', KYCRequestView.as_view(), name='kyc_request'),
    path('kyc/request/', KYCRequestView.as_view(), name='kyc_request_slash'),

    # VIP
    path('vip/status/<str:firebase_uid>', VIPStatusView.as_view(), name='vip_status'),
    path('vip/status/<str:firebase_uid>/', VIPStatusView.as_view(), name='vip_status_slash'),
    path('vip/upgrade', VIPUpgradeView.as_view(), name='vip_upgrade'),
    path('vip/upgrade/', VIPUpgradeView.as_view(), name='vip_upgrade_slash'),

    # Admin Backoffice
    path('admin/users', AdminUsersView.as_view(), name='admin_users'),
    path('admin/users/', AdminUsersView.as_view(), name='admin_users_slash'),
    path('admin/withdrawals', AdminWithdrawalsView.as_view(), name='admin_withdrawals'),
    path('admin/withdrawals/', AdminWithdrawalsView.as_view(), name='admin_withdrawals_slash'),
    path('admin/withdrawals/<str:uuid>/<str:action>', AdminWithdrawalActionView.as_view(), name='admin_withdrawal_action'),
    path('admin/withdrawals/<str:uuid>/<str:action>/', AdminWithdrawalActionView.as_view(), name='admin_withdrawal_action_slash'),
    path('admin/user/<str:userId>/fund', AdminFundUserView.as_view(), name='admin_fund_user'),
    path('admin/user/<str:userId>/fund/', AdminFundUserView.as_view(), name='admin_fund_user_slash'),
    path('admin/user/<str:userId>/<str:field>', AdminUserUpdateView.as_view(), name='admin_user_update'),
    path('admin/user/<str:userId>/<str:field>/', AdminUserUpdateView.as_view(), name='admin_user_update_slash'),
]
