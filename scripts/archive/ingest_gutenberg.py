import sqlite3
import zipfile
import tarfile
import xml.etree.ElementTree as ET
import os
import time

db_path = os.path.join(os.path.dirname(__file__), '..', 'secondary_seed.db')
zip_path = os.path.join(os.path.dirname(__file__), '..', 'Raw_Data', 'rdf-files.tar.zip')

conn = sqlite3.connect(db_path)
conn.execute('PRAGMA journal_mode = WAL;')
conn.execute('''
CREATE TABLE IF NOT EXISTS Descriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    isbn TEXT, 
    title TEXT, 
    author TEXT, 
    synopsis TEXT
);
''')
conn.execute('CREATE INDEX IF NOT EXISTS idx_isbn ON Descriptions(isbn);')
conn.execute('CREATE INDEX IF NOT EXISTS idx_title_author ON Descriptions(title, author);')

buffer = []
processed_count = 0

def flush_buffer():
    global buffer
    if not buffer: return
    conn.executemany('''
    INSERT INTO Descriptions (isbn, title, author, synopsis)
    VALUES (?, ?, ?, ?)
    ''', buffer)
    conn.commit()
    buffer = []

def handle_cooldown():
    global processed_count
    if processed_count > 0 and processed_count % 500000 == 0:
        print(f"[Cooldown] Reached {processed_count} records. Yielding event loop for 5000ms...")
        time.sleep(5)

namespaces = {
    'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'pgterms': 'http://www.gutenberg.org/2009/pgterms/',
    'dcterms': 'http://purl.org/dc/terms/'
}

with zipfile.ZipFile(zip_path, 'r') as zf:
    for name in zf.namelist():
        if name.endswith('.tar'):
            with zf.open(name) as tar_obj:
                with tarfile.open(fileobj=tar_obj, mode='r|*') as tf:
                    for member in tf:
                        if member.name.endswith('.rdf'):
                            f = tf.extractfile(member)
                            if f is not None:
                                try:
                                    tree = ET.parse(f)
                                    root = tree.getroot()
                                    ebook = root.find('.//pgterms:ebook', namespaces)
                                    if ebook is not None:
                                        title_node = ebook.find('./dcterms:title', namespaces)
                                        title = title_node.text if title_node is not None else None
                                        
                                        author = None
                                        creator = ebook.find('.//dcterms:creator//pgterms:name', namespaces)
                                        if creator is not None:
                                            author = creator.text
                                            
                                        synopsis = None
                                        desc_nodes = ebook.findall('.//dcterms:description', namespaces)
                                        desc_texts = []
                                        for d in desc_nodes:
                                            if d.text and not d.text.startswith('http'):
                                                desc_texts.append(d.text)
                                        if desc_texts:
                                            synopsis = '\n'.join(desc_texts)
                                            
                                        if synopsis and synopsis.strip():
                                            buffer.append((None, title, author, synopsis))
                                            processed_count += 1
                                            
                                            if len(buffer) >= 10000:
                                                flush_buffer()
                                                print(f"Flushed 10000 records. Total processed: {processed_count}")
                                            
                                            handle_cooldown()
                                except Exception as e:
                                    print(f"Error parsing {member.name}: {e}")

flush_buffer()
print(f"Finished processing. Total records: {processed_count}")
conn.close()
