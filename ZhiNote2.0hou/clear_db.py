import sqlite3

conn = sqlite3.connect('zhinote.db')
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print("数据库表:", tables)

for table in tables:
    table_name = table[0]
    if table_name.startswith('knowledge') or table_name.startswith('uploaded'):
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        print(f"{table_name}: {count} 条记录")
        if count > 0:
            cursor.execute(f"DELETE FROM {table_name}")
            print(f"已清空 {table_name}")

conn.commit()
conn.close()
print("操作完成")
