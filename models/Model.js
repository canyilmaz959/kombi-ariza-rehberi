const mon = require('mongoose');

const ModelSchema = new mon.Schema({
    name: {
        type: String,
        required: true,
        uppercase: true
    },

    slug:{
        type: String,
        required: true,
    },

    marka: {
        type: mon.Schema.Types.ObjectId,
        ref: 'Marka',
        required: true,
    },

    servisTelefon: String,
    servisAdres: String,
    servisEmail: String,
    servisWeb: String,
});

module.exports = mon.model('Model', ModelSchema);