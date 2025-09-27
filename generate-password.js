const bcrypt = require('bcrypt');

async function generatePassword() {
    try {
        const passwords = [
            'admin123',    // admin password
            'user123',     // regular user password
        ];

        console.log('Generating password hashes:\n');
        
        for (let password of passwords) {
            const hash = await bcrypt.hash(password, 10);
            console.log(`Password: ${password}`);
            console.log(`Hash: ${hash}`);
            console.log('-------------------');
        }

        console.log('Copy the above hashes into your database!');
        
    } catch (error) {
        console.error('Failed to generate hashes:', error);
    }
}

generatePassword();