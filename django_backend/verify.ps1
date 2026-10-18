cd c:\Users\USER\Downloads\Goalign\django_backend
.\venv\Scripts\activate

echo "=================================================="
echo "PYTHON VERSION"
python --version

echo "=================================================="
echo "DJANGO VERSION"
python -m django --version

echo "=================================================="
echo "PIP CHECK"
pip check

echo "=================================================="
echo "MANAGE.PY CHECK"
python manage.py check

echo "=================================================="
echo "MANAGE.PY TEST"
python manage.py test

echo "=================================================="
echo "MAKEMIGRATIONS CHECK"
python manage.py makemigrations --check --dry-run
