const mon = require("mongoose");

const markaSchema = new mon.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
    },
    servisTelefon: String,
    servisAdres: String,
    servisEmail: String,
    servisWeb: String,
});

module.exports = mon.model("Marka", markaSchema);