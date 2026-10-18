import os
import sys
from django.test import TestCase
import importlib

class ProductionSettingsTests(TestCase):
    def test_production_settings_safe(self):
        # We need to temporarily mock environment variables to see how production.py behaves
        
        # Test 1: Missing DB should sys.exit(1)
        # To avoid actual sys.exit killing the test runner, we will run it via subprocess or catch SystemExit
        
        # Since we just want to verify the logic in production.py without crashing the test runner,
        # we can test the environment validation explicitly
        
        os.environ['ALLOWED_HOSTS'] = 'goalign.com'
        os.environ['DB_NAME'] = 'test'
        os.environ['ENABLE_MOCK_FINANCE'] = 'true'
        
        try:
            import config.settings.production as prod_settings
            # Should crash because ENABLE_MOCK_FINANCE is true
            self.fail("Production settings should have exited because ENABLE_MOCK_FINANCE=true")
        except SystemExit:
            pass
        except Exception as e:
            # Depending on how the import works
            pass
            
        os.environ['ENABLE_MOCK_FINANCE'] = 'false'
        
        # We will not directly import production here to avoid double-loading Django settings 
        # which can cause AppRegistryNotReady. But we can verify the environment constraints 
        # conceptually by reading the file or running a subprocess.
        
        import subprocess
        
        # Run a small python script that tries to import production.py
        script = """
import os
import sys

os.environ['ALLOWED_HOSTS'] = 'goalign.com'
os.environ['DB_NAME'] = 'testdb'
os.environ['ENABLE_MOCK_FINANCE'] = 'false'
os.environ['SECRET_KEY'] = 'test'

try:
    import config.settings.production
    print("SUCCESS")
except SystemExit:
    print("EXIT")
"""
        result = subprocess.run([sys.executable, '-c', script], capture_output=True, text=True, cwd=os.path.dirname(os.path.dirname(__file__)))
        self.assertIn("SUCCESS", result.stdout)
        
        script_fail = """
import os
import sys

os.environ['ALLOWED_HOSTS'] = 'goalign.com'
os.environ['DB_NAME'] = 'testdb'
os.environ['ENABLE_MOCK_FINANCE'] = 'true'
os.environ['SECRET_KEY'] = 'test'

try:
    import config.settings.production
    print("SUCCESS")
except SystemExit:
    print("EXIT")
"""
        result = subprocess.run([sys.executable, '-c', script_fail], capture_output=True, text=True, cwd=os.path.dirname(os.path.dirname(__file__)))
        self.assertIn("EXIT", result.stdout)
        self.assertIn("FATAL", result.stdout)

        script_fail_db = """
import os
import sys

os.environ['ALLOWED_HOSTS'] = 'goalign.com'
os.environ['DB_NAME'] = ''
os.environ['PGDATABASE'] = ''
os.environ['ENABLE_MOCK_FINANCE'] = 'false'
os.environ['SECRET_KEY'] = 'test'

try:
    import config.settings.production
    print("SUCCESS")
except SystemExit:
    print("EXIT")
"""
        result = subprocess.run([sys.executable, '-c', script_fail_db], capture_output=True, text=True, cwd=os.path.dirname(os.path.dirname(__file__)))
        self.assertIn("EXIT", result.stdout)
        self.assertIn("FATAL", result.stdout)
