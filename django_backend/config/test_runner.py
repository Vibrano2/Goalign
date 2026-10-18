import os
from django.test.runner import DiscoverRunner
from django.db import connection
from django.conf import settings

class PostgresFinancialTestRunner(DiscoverRunner):
    def setup_databases(self, **kwargs):
        old_config = super().setup_databases(**kwargs)
        
        # Inject SQL schema and ledger triggers into test DB so we can test actual Postgres guarantees
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        sql_dir = os.path.join(backend_dir, 'sql')
        
        with connection.cursor() as cursor:
            with open(os.path.join(sql_dir, 'schema.sql'), 'r') as f:
                cursor.execute(f.read())
            with open(os.path.join(sql_dir, '01-ledger-system.sql'), 'r') as f:
                cursor.execute(f.read())
            with open(os.path.join(sql_dir, '02-phase1-1-hardening.sql'), 'r') as f:
                cursor.execute(f.read())
                
        return old_config
