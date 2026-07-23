#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re
import json
import urllib.request
from datetime import datetime, timedelta
from bs4 import BeautifulSoup

# Définition rigoureuse des chemins absolus du projet
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_JSON_PATH = os.path.join(BASE_DIR, 'extracted_jobs.json')

TELEGRAM_CHANNEL_URL = "https://t.me/s/lfriiactu"

def fetch_raw_telegram_posts():
    req = urllib.request.Request(
        TELEGRAM_CHANNEL_URL, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    )
    try:
        with urllib.request.urlopen(req) as response:
            return response.read().decode('utf-8')
    except Exception as e:
        print(f"Erreur lors de la récupération Telegram: {e}")
        return ""

def parse_job_post(text, post_id, date_str):
    text_lower = text.lower()
    
    keywords_job = ['recrute', 'offre', 'emploi', 'avis de recrutement', 'poste', 'stage', 'consultant', 'appel à candidature']
    if not any(k in text_lower for k in keywords_job):
        return None

    lines = [l.strip() for l in text.split('\n') if l.strip()]
    title = lines[0] if lines else "Offre d'emploi"
    for line in lines[:3]:
        if any(w in line.lower() for w in ['poste', 'recrute', 'titre', 'avis']):
            title = line
            break
    title = re.sub(r'^[🔴🚨📢OFFRE D\'EMPLOI|RECRUTEMENT|AVIS DE RECRUTEMENT\s:\-\*]+', '', title, flags=re.IGNORECASE).strip()
    if not title:
        title = "Opportunité Professionnelle LFRII"

    company = "Non spécifiée / Confidentiel"
    match_comp = re.search(r'(?:société|entreprise|structure|organisme|groupe|cabinet)\s+[:\-]?\s*([A-Z0-9\s\.\-]{2,30})', text, re.IGNORECASE)
    if match_comp:
        company = match_comp.group(1).strip()

    pays = "Togo"
    if "bénin" in text_lower: pays = "Bénin"
    elif "côte d'ivoire" in text_lower or "abidjan" in text_lower: pays = "Côte d'Ivoire"
    elif "sénégal" in text_lower or "dakar" in text_lower: pays = "Sénégal"
    elif "france" in text_lower: pays = "France"
    
    region = "Maritime" if pays == "Togo" else "N/A"
    ville = "Lomé" if pays == "Togo" else "N/A"
    
    if "kara" in text_lower: ville = "Kara"; region = "Kara"
    elif "sokodé" in text_lower: ville = "Sokodé"; region = "Centrale"
    elif "cotonou" in text_lower: ville = "Cotonou"; region = "Littoral"
    elif "abidjan" in text_lower: ville = "Abidjan"; region = "Lagunes"

    contracts = []
    if re.search(r'\bcdi\b', text_lower): contracts.append("CDI")
    if re.search(r'\bcdd\b', text_lower): contracts.append("CDD")
    if re.search(r'\bstage\b', text_lower): contracts.append("Stage")
    if re.search(r'\bconsultan[t|ce]\b', text_lower): contracts.append("Consultance")
    if re.search(r'\bfreelance\b|indépendant', text_lower): contracts.append("Freelance")
    if re.search(r'\bteletravail\b|télétravail|remote|à distance', text_lower): contracts.append("Remote")
    if re.search(r'\bflexible\b|horaire flexible', text_lower): contracts.append("Flexible")
    
    if not contracts:
        contracts = ["Non précisé"]

    expiry_date = None
    match_date = re.search(r'(?:date limite|clôture|dernier délai|avant le)\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}\s+[a-zA-zA-ÿ]+\s+\d{4})', text_lower)
    if match_date:
        expiry_date = match_date.group(1)
    else:
        expiry_date = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')

    return {
        "id": f"tg_{post_id}",
        "title": title[:120],
        "company": company[:80],
        "pays": pays,
        "region": region,
        "ville": ville,
        "contract_types": ", ".join(contracts),
        "description": text[:2000],
        "date_posted": date_str,
        "date_expiry": expiry_date,
        "source_url": f"https://t.me/lfriiactu/{post_id}",
        "status": "active"
    }

def main():
    print(f"=== Démarrage du Scraping Telegram @lfriiactu ===")
    print(f"Chemin de sortie absolu : {OUTPUT_JSON_PATH}")
    html = fetch_raw_telegram_posts()
    if not html:
        print("Erreur: Impossible de lire le canal.")
        return

    soup = BeautifulSoup(html, 'html.parser')
    posts = soup.find_all('div', class_='tgme_widget_message')
    
    parsed_jobs = []
    for post in posts:
        post_id_attr = post.get('data-post', '')
        post_id = post_id_attr.split('/')[-1] if '/' in post_id_attr else post_id_attr
        
        text_div = post.find('div', class_='tgme_widget_message_text')
        if not text_div:
            continue
        
        text = text_div.get_text(separator='\n')
        
        time_tag = post.find('time')
        date_str = time_tag.get('datetime', datetime.now().isoformat()) if time_tag else datetime.now().isoformat()
        
        job_data = parse_job_post(text, post_id, date_str)
        if job_data:
            parsed_jobs.append(job_data)

    print(f"✓ {len(parsed_jobs)} opportunités extraites avec succès.")
    
    with open(OUTPUT_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(parsed_jobs, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
