"""Fabrique assets/Alexis_Labine_CV.pdf à partir de cv-source/cv.html.

Depuis la racine du dépôt :
    pip install playwright && playwright install chromium
    python3 cv-source/fabriquer.py
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

racine = Path(__file__).resolve().parent.parent
source = racine / "cv-source" / "cv.html"
sortie = racine / "assets" / "Alexis_Labine_CV.pdf"

with sync_playwright() as p:
    navigateur = p.chromium.launch()
    page = navigateur.new_page()
    page.goto(source.as_uri(), wait_until="networkidle")
    page.pdf(path=str(sortie), format="Letter", print_background=True, prefer_css_page_size=True)
    navigateur.close()

print("écrit :", sortie)
