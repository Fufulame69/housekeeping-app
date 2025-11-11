import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow localhost
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
            return callback(null, true);
        }
        
        // Allow any Tailscale IP (100.x.x.x)
        if (origin.startsWith('http://100.')) {
            return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        // Generate a unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'product-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Database setup
const DB_PATH = path.join(__dirname, 'hotel_minibar_v2.db');
const db = new sqlite3.Database(DB_PATH);

// Create uploads directory if it doesn't exist
const fs = await import('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize database tables and seed data
function initializeDatabase() {
    db.serialize(() => {
        // Create tables
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT,
            price REAL,
            standardStock INTEGER,
            imageUrl TEXT
        )`);
        
        // Check if imageUrl column exists and add it if it doesn't
        db.all("PRAGMA table_info(products)", (err, columns) => {
            if (err) {
                console.error("Error checking products table columns:", err);
                return;
            }
            
            const hasImageUrlColumn = columns.some(col => col.name === 'imageUrl');
            if (!hasImageUrlColumn) {
                console.log("Adding imageUrl column to products table");
                db.run("ALTER TABLE products ADD COLUMN imageUrl TEXT", (alterErr) => {
                    if (alterErr) {
                        console.error("Error adding imageUrl column:", alterErr);
                    } else {
                        console.log("Successfully added imageUrl column to products table");
                    }
                });
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS rooms (
            id TEXT PRIMARY KEY,
            building INTEGER,
            minibarStock TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS roles (
            id TEXT PRIMARY KEY,
            name TEXT,
            permissions TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE,
            passkey TEXT,
            roleId TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS receipts (
            id TEXT PRIMARY KEY,
            roomId TEXT,
            building INTEGER,
            date TEXT,
            consumedItems TEXT,
            replenishmentItems TEXT,
            totalBill REAL
        )`);

        // Check if data exists, seed if empty
        db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
            if (err) {
                console.error("Error checking products table:", err);
                return;
            }
            
            if (row.count === 0) {
                seedDatabase();
            }
        });
    });
}

// Seed database with initial data
function seedDatabase() {
    const INITIAL_PRODUCTS = [
        { id: 'p1', name: 'Water', price: 2.5, standardStock: 4 },
        { id: 'p2', name: 'Soda', price: 3.0, standardStock: 4 },
        { id: 'p3', name: 'Beer', price: 4.5, standardStock: 4 },
        { id: 'p4', name: 'Wine', price: 8.0, standardStock: 2 },
        { id: 'p5', name: 'Chips', price: 2.0, standardStock: 4 },
        { id: 'p6', name: 'Chocolate', price: 3.5, standardStock: 4 },
        { id: 'p7', name: 'Nuts', price: 4.0, standardStock: 3 },
        { id: 'p8', name: 'Coffee', price: 3.0, standardStock: 4 }
    ];

    // Create minibar stock with standard stock for each product
    const createMinibarStock = () => {
        const stock = {};
        INITIAL_PRODUCTS.forEach(product => {
            stock[product.id] = product.standardStock;
        });
        return stock;
    };

    const INITIAL_ROOMS = [
        { id: '101', building: 1, minibarStock: createMinibarStock() },
        { id: '102', building: 1, minibarStock: createMinibarStock() },
        { id: '103', building: 1, minibarStock: createMinibarStock() },
        { id: '201', building: 2, minibarStock: createMinibarStock() },
        { id: '202', building: 2, minibarStock: createMinibarStock() },
        { id: '203', building: 2, minibarStock: createMinibarStock() }
    ];

    const INITIAL_ROLES = [
        { id: 'r1', name: 'Admin', permissions: ['Admin', 'Management', 'FrontDesk', 'Rooms'] },
        { id: 'r2', name: 'Management', permissions: ['Management', 'FrontDesk', 'Rooms'] },
        { id: 'r3', name: 'Front Desk', permissions: ['FrontDesk', 'Rooms'] }
    ];

    const INITIAL_USERS = [
        { id: 'u1', username: 'admin', passkey: '1234', roleId: 'r1' },
        { id: 'u2', username: 'manager', passkey: '1234', roleId: 'r2' },
        { id: 'u3', username: 'frontdesk', passkey: '1234', roleId: 'r3' }
    ];

    // Seed products
    const productStmt = db.prepare("INSERT INTO products VALUES (?, ?, ?, ?, ?)");
    INITIAL_PRODUCTS.forEach(product => {
        productStmt.run(product.id, product.name, product.price, product.standardStock, null);
    });
    productStmt.finalize();

    // Seed rooms
    const roomStmt = db.prepare("INSERT INTO rooms VALUES (?, ?, ?)");
    INITIAL_ROOMS.forEach(room => {
        roomStmt.run(room.id, room.building, JSON.stringify(room.minibarStock));
    });
    roomStmt.finalize();

    // Seed roles
    const roleStmt = db.prepare("INSERT INTO roles VALUES (?, ?, ?)");
    INITIAL_ROLES.forEach(role => {
        roleStmt.run(role.id, role.name, JSON.stringify(role.permissions));
    });
    roleStmt.finalize();

    // Seed users
    const userStmt = db.prepare("INSERT INTO users VALUES (?, ?, ?, ?)");
    INITIAL_USERS.forEach(user => {
        userStmt.run(user.id, user.username, user.passkey, user.roleId);
    });
    userStmt.finalize();

    console.log("Database seeded with initial data");
}

// API Routes

// Products
app.get('/api/products', (req, res) => {
    db.all("SELECT * FROM products ORDER BY name ASC", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/products', (req, res) => {
    const { id, name, price, standardStock, imageUrl } = req.body;
    db.run("INSERT INTO products VALUES (?, ?, ?, ?, ?)", [id, name, price, standardStock, imageUrl || null], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id, name, price, standardStock, imageUrl });
    });
});

app.put('/api/products/:id', (req, res) => {
    const { name, price, standardStock, imageUrl } = req.body;
    const { id } = req.params;
    db.run("UPDATE products SET name = ?, price = ?, standardStock = ?, imageUrl = ? WHERE id = ?", [name, price, standardStock, imageUrl || null, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id, name, price, standardStock, imageUrl });
    });
});

app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM products WHERE id = ?", [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: "Product deleted successfully" });
    });
});

// Rooms
app.get('/api/rooms', (req, res) => {
    db.all("SELECT * FROM rooms ORDER BY id ASC", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const rooms = rows.map(r => ({ ...r, minibarStock: JSON.parse(r.minibarStock) }));
        res.json(rooms);
    });
});

app.post('/api/rooms', (req, res) => {
    const { id, building, minibarStock } = req.body;
    db.run("INSERT INTO rooms VALUES (?, ?, ?)", [id, building, JSON.stringify(minibarStock)], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id, building, minibarStock });
    });
});

app.put('/api/rooms/:id', (req, res) => {
    const { originalRoomId } = req.params;
    const { newBuilding, newRoomId } = req.body;
    db.run("UPDATE rooms SET id = ?, building = ? WHERE id = ?", [newRoomId, newBuilding, originalRoomId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: newRoomId, building: newBuilding });
    });
});

app.delete('/api/rooms/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM rooms WHERE id = ?", [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: "Room deleted successfully" });
    });
});

app.delete('/api/buildings/:buildingNumber', (req, res) => {
    const { buildingNumber } = req.params;
    db.run("DELETE FROM rooms WHERE building = ?", [buildingNumber], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: "Building deleted successfully" });
    });
});

app.put('/api/rooms/:id/stock', (req, res) => {
    const { id } = req.params;
    const { newStock } = req.body;
    db.run("UPDATE rooms SET minibarStock = ? WHERE id = ?", [JSON.stringify(newStock), id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id, minibarStock: newStock });
    });
});

// Users
app.get('/api/users', (req, res) => {
    db.all("SELECT * FROM users ORDER BY username ASC", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/users', (req, res) => {
    const { id, username, passkey, roleId } = req.body;
    db.run("INSERT INTO users VALUES (?, ?, ?, ?)", [id, username, passkey, roleId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id, username, passkey, roleId });
    });
});

app.put('/api/users/:id', (req, res) => {
    const { username, passkey, roleId } = req.body;
    const { id } = req.params;
    db.run("UPDATE users SET username = ?, passkey = ?, roleId = ? WHERE id = ?", [username, passkey, roleId, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id, username, passkey, roleId });
    });
});

app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM users WHERE id = ?", [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: "User deleted successfully" });
    });
});

// Roles
app.get('/api/roles', (req, res) => {
    db.all("SELECT * FROM roles ORDER BY name ASC", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const roles = rows.map(r => ({ ...r, permissions: JSON.parse(r.permissions) }));
        res.json(roles);
    });
});

app.post('/api/roles', (req, res) => {
    const { id, name, permissions } = req.body;
    db.run("INSERT INTO roles VALUES (?, ?, ?)", [id, name, JSON.stringify(permissions)], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id, name, permissions });
    });
});

app.put('/api/roles/:id', (req, res) => {
    const { name, permissions } = req.body;
    const { id } = req.params;
    db.run("UPDATE roles SET name = ?, permissions = ? WHERE id = ?", [name, JSON.stringify(permissions), id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id, name, permissions });
    });
});

app.delete('/api/roles/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM roles WHERE id = ?", [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: "Role deleted successfully" });
    });
});

// Receipts
app.get('/api/receipts', (req, res) => {
    db.all("SELECT * FROM receipts", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const receipts = rows.map(r => ({ 
            ...r, 
            consumedItems: JSON.parse(r.consumedItems), 
            replenishmentItems: JSON.parse(r.replenishmentItems) 
        }));
        res.json(receipts);
    });
});

app.post('/api/receipts', (req, res) => {
    const { id, roomId, building, date, consumedItems, replenishmentItems, totalBill } = req.body;
    db.run("INSERT INTO receipts VALUES (?, ?, ?, ?, ?, ?, ?)", [
        id,
        roomId,
        building,
        date,
        JSON.stringify(consumedItems),
        JSON.stringify(replenishmentItems),
        totalBill
    ], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id, roomId, building, date, consumedItems, replenishmentItems, totalBill });
    });
});

// Image upload endpoint
app.post('/api/upload-product-image', upload.single('image'), (req, res) => {
    console.log('Image upload request received');
    
    if (!req.file) {
        console.error('No image file provided in request');
        return res.status(400).json({ error: 'No image file provided' });
    }
    
    console.log('File uploaded successfully:', req.file.filename);
    console.log('File details:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
    });
    
    // Return the URL that can be used to access the image
    const imageUrl = `/uploads/${req.file.filename}`;
    console.log('Image URL generated:', imageUrl);
    
    res.json({ imageUrl });
});

// Image deletion endpoint
app.delete('/api/product-image/:productId', (req, res) => {
    const { productId } = req.params;
    
    // First, get the current product to find its image URL
    db.get("SELECT imageUrl FROM products WHERE id = ?", [productId], (err, row) => {
        if (err) {
            console.error('Error fetching product:', err);
            return res.status(500).json({ error: err.message });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        if (!row.imageUrl) {
            return res.status(400).json({ error: 'Product has no image to delete' });
        }
        
        // Extract filename from URL
        const filename = row.imageUrl.replace('/uploads/', '');
        const filePath = path.join(__dirname, 'uploads', filename);
        
        // Delete the file from the filesystem
        fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
                console.error('Error deleting image file:', unlinkErr);
                // Continue with database update even if file deletion fails
            } else {
                console.log('Image file deleted successfully:', filename);
            }
            
            // Update the product to remove the image URL
            db.run("UPDATE products SET imageUrl = NULL WHERE id = ?", [productId], function(updateErr) {
                if (updateErr) {
                    console.error('Error updating product:', updateErr);
                    return res.status(500).json({ error: updateErr.message });
                }
                
                console.log('Product image reference removed from database');
                res.json({ message: 'Product image deleted successfully' });
            });
        });
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Accessible via Tailscale at: http://100.86.74.125:${PORT}`);
    initializeDatabase();
});