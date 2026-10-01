import sqlite3
import os
import unittest

DB_PATH = "db/secondary_seed.db"

class TestSecondarySeedDB(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.conn = sqlite3.connect(DB_PATH)
        cls.cursor = cls.conn.cursor()

    @classmethod
    def tearDownClass(cls):
        cls.conn.close()

    def test_db_exists(self):
        self.assertTrue(os.path.exists(DB_PATH), f"Database file does not exist at {DB_PATH}.")

    def test_descriptions_table_exists(self):
        self.cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='Descriptions'")
        table = self.cursor.fetchone()
        self.assertIsNotNone(table, "Descriptions table is missing.")

    def test_has_data(self):
        self.cursor.execute("SELECT COUNT(*) FROM Descriptions")
        count = self.cursor.fetchone()[0]
        self.assertGreater(count, 0, "Descriptions table is empty.")

    def test_isbn_not_null(self):
        self.cursor.execute("SELECT COUNT(*) FROM Descriptions WHERE isbn IS NULL")
        count = self.cursor.fetchone()[0]
        self.assertEqual(count, 0, "Found records with NULL ISBN.")

    def test_title_not_null(self):
        self.cursor.execute("SELECT COUNT(*) FROM Descriptions WHERE title IS NULL")
        count = self.cursor.fetchone()[0]
        self.assertEqual(count, 0, "Found records with NULL title.")

if __name__ == '__main__':
    unittest.main()
