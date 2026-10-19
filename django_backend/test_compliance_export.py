import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

import csv
import io
from django.test import Client
from django.contrib.auth import get_user_model
from apps.audit.models import AuditLog

User = get_user_model()
admin_user = User.objects.filter(is_superuser=True).first()
if not admin_user:
    admin_user = User.objects.create_superuser('test_auditor', 'auditor@goalign.com', 'TestAuditor123!')

client = Client()
client.force_login(admin_user)

print("--- Testing Compliance Reports Hub ---")
resp = client.get('/admin/compliance-reports/')
assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
content = resp.content.decode('utf-8')
assert "Compliance & Regulatory Audit Hub" in content, "Hub title missing"
assert "General Ledger Journal" in content, "Ledger card missing"
assert "Regulatory Audit Trail" in content, "Audit card missing"
assert "Trading Execution & Fees" in content, "Trades card missing"
assert "Treasury & Balances Snapshot" in content, "Balances card missing"
assert "Withdrawals & Disbursements" in content, "Withdrawals card missing"
assert "P2P Orders & Disputes" in content, "P2P card missing"
print("[PASS] 1. Hub View rendered with all 6 report modules.")

print("--- Testing CSV Downloads ---")
reports = ['ledger', 'audit', 'trades', 'balances', 'withdrawals', 'p2p']
for r_type in reports:
    dl_resp = client.get(f'/admin/compliance-reports/download/{r_type}/?start_date=2026-01-01')
    assert dl_resp.status_code == 200, f"Failed download for {r_type}: {dl_resp.status_code}"
    assert 'text/csv' in dl_resp['Content-Type'], f"Invalid Content-Type for {r_type}"
    assert 'filename=' in dl_resp['Content-Disposition'], f"Missing filename in disposition for {r_type}"
    
    csv_text = dl_resp.content.decode('utf-8')
    reader = csv.reader(io.StringIO(csv_text))
    header = next(reader)
    assert len(header) >= 4, f"Header too short for {r_type}: {header}"
    print(f"[PASS] 2. Download {r_type.upper()}: valid RFC-4180 CSV with headers {header[:4]}...")

print("--- Testing Admin Model Action CSV Export ---")
# Test export_as_csv_action on AuditLog
from apps.audit.admin import AuditLogAdmin
from apps.audit.export import export_as_csv_action
from django.contrib.admin.sites import AdminSite

site = AdminSite()
model_admin = AuditLogAdmin(AuditLog, site)
action_func = export_as_csv_action(filename_prefix="test_audit")
qs = AuditLog.objects.all()[:5]
action_resp = action_func(model_admin, None, qs)
assert action_resp.status_code == 200
assert 'text/csv' in action_resp['Content-Type']
assert 'filename=' in action_resp['Content-Disposition']
reader = csv.reader(io.StringIO(action_resp.content.decode('utf-8')))
header = next(reader)
assert 'ACTION' in header or 'TIMESTAMP' in header
print(f"[PASS] 3. Admin ModelAction CSV export verified on AuditLog.")

print("\nALL COMPLIANCE REPORTING & CSV EXPORT TESTS PASSED SUCCESSFULLY!")
