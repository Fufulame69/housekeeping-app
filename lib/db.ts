
import { INITIAL_PRODUCTS, INITIAL_ROOMS, INITIAL_ROLES, INITIAL_USERS } from '../constants';
import type { Product, Room, User, Role, Receipt } from '../types';

declare const initSqlJs: any;

let db: any = null;

export async function init() {
    if (db) return;
    try {
        const SQL = await initSqlJs({
            locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
        });
        
        const dbData = localStorage.getItem('minibar_db');
        if (dbData) {
            const dbArray = JSON.parse(dbData);
            db = new SQL.Database(new Uint8Array(dbArray));
        } else {
            db = new SQL.Database();
            createTables();
            seedData();
            saveDB();
        }
    } catch (err) {
        console.error("Failed to initialize database:", err);
        throw err;
    }
}

function saveDB() {
    if (!db) return;
    const data = db.export();
    localStorage.setItem('minibar_db', JSON.stringify(Array.from(data)));
}

function createTables() {
    db.exec(`
        CREATE TABLE products (id TEXT PRIMARY KEY, name TEXT, price REAL, standardStock INTEGER);
        CREATE TABLE rooms (id TEXT PRIMARY KEY, building INTEGER, minibarStock TEXT);
        CREATE TABLE roles (id TEXT PRIMARY KEY, name TEXT, permissions TEXT);
        CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT UNIQUE, passkey TEXT, roleId TEXT);
        CREATE TABLE receipts (id TEXT PRIMARY KEY, roomId TEXT, building INTEGER, date TEXT, consumedItems TEXT, replenishmentItems TEXT, totalBill REAL);
    `);
}

function seedData() {
    const seed = (table: string, columns: string[], data: any[]) => {
        const placeholders = columns.map(() => '?').join(',');
        const stmt = db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`);
        data.forEach(item => {
            const values = columns.map(col => {
                const val = item[col as keyof typeof item];
                return typeof val === 'object' ? JSON.stringify(val) : val;
            });
            stmt.run(values);
        });
        stmt.free();
    };

    seed('products', ['id', 'name', 'price', 'standardStock'], INITIAL_PRODUCTS);
    seed('rooms', ['id', 'building', 'minibarStock'], INITIAL_ROOMS);
    seed('roles', ['id', 'name', 'permissions'], INITIAL_ROLES);
    seed('users', ['id', 'username', 'passkey', 'roleId'], INITIAL_USERS);
}

// --- Helper Functions ---
function query(sql: string, params: any[] = []): any[] {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

function exec(sql: string, params: any[] = []) {
    db.run(sql, params);
    saveDB();
}

// --- Data Fetching ---
export const getProducts = async (): Promise<Product[]> => query("SELECT * FROM products ORDER BY name ASC");
export const getUsers = async (): Promise<User[]> => query("SELECT * FROM users ORDER BY username ASC");
export const getReceipts = async (): Promise<Receipt[]> => {
    const results = query("SELECT * FROM receipts");
    return results.map(r => ({ ...r, consumedItems: JSON.parse(r.consumedItems), replenishmentItems: JSON.parse(r.replenishmentItems) }));
};
export const getRooms = async (): Promise<Room[]> => {
    const results = query("SELECT * FROM rooms ORDER BY id ASC");
    return results.map(r => ({ ...r, minibarStock: JSON.parse(r.minibarStock) }));
};
export const getRoles = async (): Promise<Role[]> => {
    const results = query("SELECT * FROM roles ORDER BY name ASC");
    return results.map(r => ({ ...r, permissions: JSON.parse(r.permissions) }));
};

// --- Data Modification ---

// Products
export const addProduct = async (product: Product) => exec("INSERT INTO products VALUES (?, ?, ?, ?)", [product.id, product.name, product.price, product.standardStock]);
export const updateProduct = async (product: Product) => exec("UPDATE products SET name = ?, price = ?, standardStock = ? WHERE id = ?", [product.name, product.price, product.standardStock, product.id]);
export const deleteProduct = async (productId: string) => exec("DELETE FROM products WHERE id = ?", [productId]);

// Rooms
export const addRoom = async (room: Room) => exec("INSERT INTO rooms VALUES (?, ?, ?)", [room.id, room.building, JSON.stringify(room.minibarStock)]);
export const updateRoom = async (originalRoomId: string, newBuilding: number, newRoomId: string) => exec("UPDATE rooms SET id = ?, building = ? WHERE id = ?", [newRoomId, newBuilding, originalRoomId]);
export const deleteRoom = async (roomId: string) => exec("DELETE FROM rooms WHERE id = ?", [roomId]);
export const deleteBuilding = async (buildingNumber: number) => exec("DELETE FROM rooms WHERE building = ?", [buildingNumber]);
export const updateRoomStock = async (roomId: string, newStock: { [productId: string]: number }) => exec("UPDATE rooms SET minibarStock = ? WHERE id = ?", [JSON.stringify(newStock), roomId]);

// Users
export const addUser = async (user: User) => exec("INSERT INTO users VALUES (?, ?, ?, ?)", [user.id, user.username, user.passkey, user.roleId]);
export const updateUser = async (user: User) => exec("UPDATE users SET username = ?, passkey = ?, roleId = ? WHERE id = ?", [user.username, user.passkey, user.roleId, user.id]);
export const deleteUser = async (userId: string) => exec("DELETE FROM users WHERE id = ?", [userId]);

// Roles
export const addRole = async (role: Role) => exec("INSERT INTO roles VALUES (?, ?, ?)", [role.id, role.name, JSON.stringify(role.permissions)]);
export const updateRole = async (role: Role) => exec("UPDATE roles SET name = ?, permissions = ? WHERE id = ?", [role.name, JSON.stringify(role.permissions), role.id]);
export const deleteRole = async (roleId: string) => exec("DELETE FROM roles WHERE id = ?", [roleId]);

// Receipts
export const addReceipt = async (receipt: Receipt) => exec("INSERT INTO receipts VALUES (?, ?, ?, ?, ?, ?, ?)", [
    receipt.id,
    receipt.roomId,
    receipt.building,
    receipt.date,
    JSON.stringify(receipt.consumedItems),
    JSON.stringify(receipt.replenishmentItems),
    receipt.totalBill
]);
