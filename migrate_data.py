#!/usr/bin/env python3
"""
Data Migration Script: LocalStorage to Database
This script helps migrate data from browser localStorage to MySQL database
"""

import json
import mysql.connector
from werkzeug.security import generate_password_hash
from datetime import datetime
import os

class DataMigrator:
    def __init__(self):
        self.db_config = {
            'host': 'localhost',
            'user': 'root',
            'password': '',  # Change if you have a MySQL password
            'database': 'college_portal'
        }
        self.connection = None
        
    def connect_database(self):
        """Connect to MySQL database"""
        try:
            self.connection = mysql.connector.connect(**self.db_config)
            print("✅ Connected to MySQL database successfully!")
            return True
        except mysql.connector.Error as err:
            print(f"❌ Error connecting to database: {err}")
            return False
    
    def setup_database(self):
        """Create database and tables if they don't exist"""
        try:
            # Read and execute the SQL setup file
            with open('database_setup.sql', 'r') as file:
                sql_commands = file.read()
            
            cursor = self.connection.cursor()
            
            # Split commands by semicolon and execute each
            for command in sql_commands.split(';'):
                command = command.strip()
                if command:
                    cursor.execute(command)
            
            self.connection.commit()
            cursor.close()
            print("✅ Database setup completed!")
            return True
            
        except Exception as e:
            print(f"❌ Error setting up database: {e}")
            return False
    
    def migrate_users(self, users_data):
        """Migrate users from localStorage to database"""
        if not users_data:
            print("ℹ️ No users data to migrate")
            return
            
        cursor = self.connection.cursor()
        migrated_count = 0
        
        for user in users_data:
            try:
                # Check if user already exists
                cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", 
                             (user.get('username'), user.get('email')))
                
                if cursor.fetchone():
                    print(f"⚠️ User {user.get('username')} already exists, skipping...")
                    continue
                
                # Insert new user
                insert_query = """
                INSERT INTO users (username, email, password_hash, created_at)
                VALUES (%s, %s, %s, %s)
                """
                
                # Hash the password (assuming plain text in localStorage)
                password_hash = generate_password_hash(user.get('password', 'defaultpass123'))
                created_at = user.get('registeredAt', datetime.now().isoformat())
                
                cursor.execute(insert_query, (
                    user.get('username'),
                    user.get('email'),
                    password_hash,
                    created_at
                ))
                
                migrated_count += 1
                print(f"✅ Migrated user: {user.get('username')}")
                
            except Exception as e:
                print(f"❌ Error migrating user {user.get('username')}: {e}")
        
        self.connection.commit()
        cursor.close()
        print(f"📊 Migrated {migrated_count} users successfully!")
    
    def migrate_issues(self, issues_data, user_mapping):
        """Migrate issues from localStorage to database"""
        if not issues_data:
            print("ℹ️ No issues data to migrate")
            return
            
        cursor = self.connection.cursor()
        migrated_count = 0
        
        for issue in issues_data:
            try:
                # Map userId to database user ID
                user_id = user_mapping.get(issue.get('userId'))
                if not user_id:
                    print(f"⚠️ User ID {issue.get('userId')} not found, skipping issue...")
                    continue
                
                insert_query = """
                INSERT INTO issues (user_id, category, title, description, location, priority, status, upvotes, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                cursor.execute(insert_query, (
                    user_id,
                    issue.get('category', 'General'),
                    issue.get('title', 'Untitled Issue'),
                    issue.get('description', ''),
                    issue.get('location', ''),
                    issue.get('priority', 'Medium'),
                    issue.get('status', 'Pending'),
                    issue.get('upvotes', 0),
                    issue.get('createdAt', datetime.now().isoformat())
                ))
                
                migrated_count += 1
                
            except Exception as e:
                print(f"❌ Error migrating issue: {e}")
        
        self.connection.commit()
        cursor.close()
        print(f"📊 Migrated {migrated_count} issues successfully!")
    
    def migrate_feedback(self, feedback_data, user_mapping):
        """Migrate feedback from localStorage to database"""
        if not feedback_data:
            print("ℹ️ No feedback data to migrate")
            return
            
        cursor = self.connection.cursor()
        migrated_count = 0
        
        for feedback in feedback_data:
            try:
                user_id = user_mapping.get(feedback.get('userId'))
                if not user_id:
                    continue
                
                insert_query = """
                INSERT INTO feedback (user_id, category, rating, text, created_at)
                VALUES (%s, %s, %s, %s, %s)
                """
                
                cursor.execute(insert_query, (
                    user_id,
                    feedback.get('category', 'General'),
                    feedback.get('rating', 5),
                    feedback.get('text', ''),
                    feedback.get('createdAt', datetime.now().isoformat())
                ))
                
                migrated_count += 1
                
            except Exception as e:
                print(f"❌ Error migrating feedback: {e}")
        
        self.connection.commit()
        cursor.close()
        print(f"📊 Migrated {migrated_count} feedback entries successfully!")
    
    def migrate_lost_found(self, items_data, user_mapping):
        """Migrate lost and found items from localStorage to database"""
        if not items_data:
            print("ℹ️ No lost & found data to migrate")
            return
            
        cursor = self.connection.cursor()
        migrated_count = 0
        
        for item in items_data:
            try:
                user_id = user_mapping.get(item.get('userId'))
                if not user_id:
                    continue
                
                insert_query = """
                INSERT INTO lost_found_items (user_id, type, name, description, location, contact, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """
                
                cursor.execute(insert_query, (
                    user_id,
                    item.get('type', 'lost'),
                    item.get('name', 'Unknown Item'),
                    item.get('description', ''),
                    item.get('location', ''),
                    item.get('contact', ''),
                    item.get('createdAt', datetime.now().isoformat())
                ))
                
                migrated_count += 1
                
            except Exception as e:
                print(f"❌ Error migrating lost/found item: {e}")
        
        self.connection.commit()
        cursor.close()
        print(f"📊 Migrated {migrated_count} lost & found items successfully!")
    
    def get_user_mapping(self):
        """Get mapping of old user IDs to new database IDs"""
        cursor = self.connection.cursor()
        cursor.execute("SELECT id, username FROM users")
        users = cursor.fetchall()
        cursor.close()
        
        # This is a simplified mapping - in real scenario you'd need to match by username/email
        mapping = {}
        for i, (db_id, username) in enumerate(users):
            mapping[str(i + 1)] = db_id  # Assuming localStorage used sequential IDs
        
        return mapping
    
    def run_migration(self, localStorage_data):
        """Run the complete migration process"""
        print("🚀 Starting data migration from localStorage to database...")
        
        if not self.connect_database():
            return False
        
        if not self.setup_database():
            return False
        
        # Parse localStorage data
        users = localStorage_data.get('users', [])
        issues = localStorage_data.get('issues', [])
        feedback = localStorage_data.get('feedback', [])
        lost_found = localStorage_data.get('lostFoundItems', [])
        
        # Migrate data
        self.migrate_users(users)
        user_mapping = self.get_user_mapping()
        self.migrate_issues(issues, user_mapping)
        self.migrate_feedback(feedback, user_mapping)
        self.migrate_lost_found(lost_found, user_mapping)
        
        print("✅ Migration completed successfully!")
        return True
    
    def close_connection(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            print("🔒 Database connection closed")

def main():
    """Main migration function"""
    print("=" * 60)
    print("📦 College Portal Data Migration Tool")
    print("=" * 60)
    
    # Instructions for user
    print("""
📋 INSTRUCTIONS:
1. Open your website in browser
2. Press F12 → Console tab
3. Run this command to export localStorage data:
   
   console.log(JSON.stringify({
       users: JSON.parse(localStorage.getItem('users') || '[]'),
       issues: JSON.parse(localStorage.getItem('issues') || '[]'),
       feedback: JSON.parse(localStorage.getItem('feedback') || '[]'),
       lostFoundItems: JSON.parse(localStorage.getItem('lostFoundItems') || '[]'),
       orders: JSON.parse(localStorage.getItem('orders') || '[]')
   }));

4. Copy the output and save it as 'localStorage_data.json' in this directory
5. Run this script again
    """)
    
    # Check if data file exists
    if not os.path.exists('localStorage_data.json'):
        print("❌ localStorage_data.json not found!")
        print("Please follow the instructions above to export your data first.")
        return
    
    # Load localStorage data
    try:
        with open('localStorage_data.json', 'r') as f:
            localStorage_data = json.load(f)
        print("✅ localStorage data loaded successfully!")
    except Exception as e:
        print(f"❌ Error loading localStorage data: {e}")
        return
    
    # Run migration
    migrator = DataMigrator()
    success = migrator.run_migration(localStorage_data)
    migrator.close_connection()
    
    if success:
        print("\n🎉 Migration completed! Your data is now in the database.")
        print("Next steps:")
        print("1. Start the Flask backend: python run.py")
        print("2. Update your frontend to use API calls instead of localStorage")
    else:
        print("\n❌ Migration failed. Please check the errors above.")

if __name__ == "__main__":
    main()
