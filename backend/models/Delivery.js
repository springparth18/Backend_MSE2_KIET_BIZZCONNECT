const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  // Virtual distribution hub
  hubReceived: { type: Boolean, default: false },
  hubReceivedAt: { type: Date },
  // Verification
  qualityChecked: { type: Boolean, default: false },
  qualityNotes: { type: String, trim: true },
  damagedItems: { type: Number, default: 0 },
  shortageItems: { type: Number, default: 0 },
  // Dispatch
  sortedAt: { type: Date },
  dispatchedAt: { type: Date },
  deliveredAt: { type: Date },
  // Status
  status: {
    type: String,
    enum: [
      'awaiting_shipment', 'in_transit_to_hub',
      'at_hub', 'sorting', 'dispatched',
      'out_for_delivery', 'delivered', 'failed',
    ],
    default: 'awaiting_shipment',
  },
  // Driver / logistics
  driverName: { type: String, trim: true },
  driverPhone: { type: String, trim: true },
  vehicleNumber: { type: String, trim: true },
  // Tracking
  trackingUpdates: [{
    status: String,
    location: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Delivery', deliverySchema);
