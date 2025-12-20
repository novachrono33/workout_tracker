#!/bin/bash
echo "Running backend linting..."
cd backend

echo "1. Sorting imports..."
python -m isort app/

echo "2. Formatting code..."
python -m black app/

echo "3. Checking style..."
python -m flake8 app/

echo "4. Type checking..."
python -m mypy app/

echo "5. Security scan..."
python -m bandit -r app/ -q

if [ -f requirements.txt ]; then
  echo "6. Checking dependencies..."
  python -m safety check -r requirements.txt
fi

echo "✅ Done!"