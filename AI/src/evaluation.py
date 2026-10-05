"""Alias for the evaluation.py command requested in the specification."""
try:
    from .evaluate import main
except ImportError:
    from evaluate import main

if __name__ == '__main__':
    main()
