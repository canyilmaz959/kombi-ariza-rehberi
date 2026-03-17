const mon = require("mongoose");

const arizSchema = new mon.Schema({
    marka: {
        type: mon.Schema.Types.ObjectId,
        ref: "Marka",
        required: true
    },
    model:{
        type: mon.Schema.Types.ObjectId,
        ref: "Model",
        required: true
    },
    kod: {
        type: String, 
        required: true,
        uppercase: true,
        trim: true
    },
    baslik: {type: String},
    aciklama: {type: String},
    cozum: {type: String},
    tarih: {type: Date}
});

arizSchema.index({ kod: 1, marka: 1, model: 1}, { unique: true }); // Kod ve marka kombinasyonunu benzersiz yap

module.exports = mon.model("arizalar", arizSchema);
// Ariza modelini içe aktar