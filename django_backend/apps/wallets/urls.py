from django.urls import path
from .views import (
    BalancesView,
    DepositAddressView,
    DepositView,
    WithdrawView,
    WithdrawalsHistoryView,
    LinkWeb3View,
    WalletTransferView
)

urlpatterns = [
    path('transfer', WalletTransferView.as_view(), name='wallet_transfer'),
    path('transfer/', WalletTransferView.as_view(), name='wallet_transfer_slash'),
    path('balances/<str:user_id>', BalancesView.as_view(), name='wallet_balances'),
    path('balances/<str:user_id>/', BalancesView.as_view(), name='wallet_balances_slash'),
    path('deposit-address', DepositAddressView.as_view(), name='wallet_deposit_address'),
    path('deposit-address/', DepositAddressView.as_view(), name='wallet_deposit_address_slash'),
    path('deposit', DepositView.as_view(), name='wallet_deposit'),
    path('deposit/', DepositView.as_view(), name='wallet_deposit_slash'),
    path('withdraw', WithdrawView.as_view(), name='wallet_withdraw'),
    path('withdraw/', WithdrawView.as_view(), name='wallet_withdraw_slash'),
    path('withdrawals', WithdrawalsHistoryView.as_view(), name='wallet_withdrawals'),
    path('withdrawals/', WithdrawalsHistoryView.as_view(), name='wallet_withdrawals_slash'),
    path('link-web3', LinkWeb3View.as_view(), name='wallet_link_web3'),
    path('link-web3/', LinkWeb3View.as_view(), name='wallet_link_web3_slash'),
]
