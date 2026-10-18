import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.test import Client
from apps.authentication.models import GoalignAccount
from apps.wallets.models import Balance

def run_suite():
    c = Client()
    print("=== Running Comprehensive Goalign Django Test Suite ===")

    # 1. Auth Sync
    res = c.post('/api/auth/sync', {'firebase_uid': 'test_fb_user_999', 'email': 'suite_user@goalign.com', 'display_name': 'Suite User'}, content_type='application/json')
    assert res.status_code == 200, f"Auth sync failed: {res.status_code} {res.content}"
    print("[PASS] 1. Auth sync")

    # 2. Auth Me
    res = c.get('/api/auth/me?firebase_uid=test_fb_user_999')
    assert res.status_code == 200, f"Auth me failed: {res.status_code} {res.content}"
    print("[PASS] 2. Auth me")

    # 3. Wallet Deposit
    res = c.post('/api/wallet/deposit', {'user_id': 'test_fb_user_999', 'asset': 'USDT', 'amount': 1000, 'account_type': 'spot'}, content_type='application/json')
    assert res.status_code == 200, f"Deposit failed: {res.status_code} {res.content}"
    print("[PASS] 3. Wallet deposit")

    # 4. Wallet Balances
    res = c.get('/api/wallet/balances/test_fb_user_999')
    assert res.status_code == 200, f"Balances failed: {res.status_code} {res.content}"
    print("[PASS] 4. Wallet balances")

    # 5. Spot Order
    res = c.post('/api/trade/order', {'user_id': 'test_fb_user_999', 'symbol': 'BTCUSDT', 'side': 'buy', 'type': 'market', 'amount': 0.001, 'account_type': 'spot'}, content_type='application/json')
    assert res.status_code == 200, f"Spot trade failed: {res.status_code} {res.content}"
    print("[PASS] 5. Spot order placement")

    # 5b. Wallet Transfer (Spot -> Futures)
    res = c.post('/api/wallet/transfer', {'user_id': 'test_fb_user_999', 'asset': 'USDT', 'from_account': 'spot', 'to_account': 'futures', 'amount': 200}, content_type='application/json')
    assert res.status_code == 200, f"Wallet transfer failed: {res.status_code} {res.content}"
    print("[PASS] 5b. Internal wallet transfer (Spot -> Futures)")

    # 6. Futures Open & Close
    res = c.post('/api/futures/open', {'user_id': 'test_fb_user_999', 'symbol': 'BTCUSDT', 'side': 'long', 'leverage': 10, 'margin': 50}, content_type='application/json')
    assert res.status_code == 200, f"Futures open failed: {res.status_code} {res.content}"
    pos_id = res.json().get('positionId')
    print("[PASS] 6a. Futures position opened")

    res = c.post('/api/futures/close', {'user_id': 'test_fb_user_999', 'position_id': pos_id}, content_type='application/json')
    assert res.status_code == 200, f"Futures close failed: {res.status_code} {res.content}"
    print("[PASS] 6b. Futures position closed")

    # 7. Options Chain & Trade
    res = c.get('/api/options/chain/BTC')
    assert res.status_code == 200, f"Options chain failed: {res.status_code} {res.content}"
    res = c.post('/api/options/trade', {'user_id': 'test_fb_user_999', 'symbol': 'BTCUSDT', 'type': 'call', 'strike_price': 70000, 'premium': 10, 'size': 1}, content_type='application/json')
    assert res.status_code == 200, f"Options trade failed: {res.status_code} {res.content}"
    print("[PASS] 7. Options chain and trade")

    # 8. P2P Ads & Seeding
    res = c.post('/api/p2p/seed')
    assert res.status_code == 200, f"P2P seed failed: {res.status_code} {res.content}"
    res = c.get('/api/p2p/ads')
    assert res.status_code == 200, f"P2P ads failed: {res.status_code} {res.content}"
    print("[PASS] 8. P2P seed & ads")

    # 9. CopyTrading
    res = c.get('/api/copytrade/masters')
    assert res.status_code == 200, f"Copy masters failed: {res.status_code} {res.content}"
    res = c.post('/api/copytrade/copy', {'user_id': 'test_fb_user_999', 'master_name': 'Alpha Crypto Whale', 'amount': 100}, content_type='application/json')
    assert res.status_code == 200, f"Copy trade failed: {res.status_code} {res.content}"
    alloc_id = res.json().get('allocationId')
    res = c.post('/api/copytrade/stop', {'user_id': 'test_fb_user_999', 'allocation_id': alloc_id}, content_type='application/json')
    assert res.status_code == 200, f"Stop copy failed: {res.status_code} {res.content}"
    print("[PASS] 9. CopyTrading flow")

    # 10. Earn / Staking
    res = c.post('/api/earn/subscribe', {'user_id': 'test_fb_user_999', 'asset': 'USDT', 'amount': 50, 'apy': 12.0}, content_type='application/json')
    assert res.status_code == 200, f"Earn subscribe failed: {res.status_code} {res.content}"
    stake_id = res.json().get('stakeId')
    res = c.post('/api/earn/redeem', {'user_id': 'test_fb_user_999', 'stake_id': stake_id}, content_type='application/json')
    assert res.status_code == 200, f"Earn redeem failed: {res.status_code} {res.content}"
    print("[PASS] 10. Earn & Staking flow")

    # 11. Invest / Quantify
    res = c.get('/api/invest/quantify-plans')
    assert res.status_code == 200, f"Quantify plans failed: {res.status_code} {res.content}"
    res = c.post('/api/invest/quantify/buy', {'firebaseUid': 'test_fb_user_999', 'planId': 1, 'amount': 20}, content_type='application/json')
    assert res.status_code == 200, f"Quantify buy failed: {res.status_code} {res.content}"
    res = c.post('/api/invest/pledge', {'user_id': 'test_fb_user_999', 'asset': 'USDT', 'amount': 20}, content_type='application/json')
    assert res.status_code == 200, f"Invest pledge failed: {res.status_code} {res.content}"
    print("[PASS] 11. Invest / Quantify flow")

    # 12. KYC & VIP
    res = c.post('/api/kyc/request', {'user_id': 'test_fb_user_999', 'full_name': 'Test User', 'date_of_birth': '1995-05-15', 'address': '123 Wall St'}, content_type='application/json')
    assert res.status_code == 200, f"KYC request failed: {res.status_code} {res.content}"
    res = c.get('/api/kyc/status/test_fb_user_999')
    assert res.status_code == 200 and res.json().get('status') == 'pending', f"KYC status failed: {res.json()}"
    res = c.get('/api/vip/status/test_fb_user_999')
    assert res.status_code == 200, f"VIP status failed: {res.status_code} {res.content}"
    print("[PASS] 12. KYC and VIP flow")

    # 13. Admin Backoffice
    res = c.get('/api/admin/users')
    assert res.status_code == 200, f"Admin users failed: {res.status_code} {res.content}"
    res = c.post('/api/admin/user/test_fb_user_999/fund', {'asset': 'USDT', 'amount': 500, 'account_type': 'spot'}, content_type='application/json')
    assert res.status_code == 200, f"Admin fund failed: {res.status_code} {res.content}"
    print("[PASS] 13. Admin Backoffice flow")

    print("\nALL 13 API DOMAINS PASSED WITH 100% SUCCESS!")

if __name__ == '__main__':
    run_suite()
