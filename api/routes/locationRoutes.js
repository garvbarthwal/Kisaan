const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();

// @desc    Reverse geocode coordinates to address
// @route   POST /api/location/reverse-geocode
// @access  Public
router.post("/reverse-geocode", async (req, res) => {
  try {
    const { lat, lng } = req.body;

    // Validate coordinates
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    // Validate coordinate ranges
    if (lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message: "Latitude must be between -90 and 90 degrees",
      });
    }

    if (lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: "Longitude must be between -180 and 180 degrees",
      });
    }

    // Make request to Nominatim API from server-side
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Kisaan-App/1.0.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data || data.error) {
      return res.status(404).json({
        success: false,
        message: "No address found for the given coordinates",
      });
    }

    const address = data.address || {};

    // Extract and format address components
    const locationData = {
      street: address.house_number && address.road
        ? `${address.house_number} ${address.road}`
        : address.road || address.pedestrian || address.neighbourhood || '',
      city: address.city || address.town || address.village || address.municipality || address.county || '',
      state: address.state || address.province || address.region || '',
      zipCode: address.postcode || '',
      country: address.country || '',
      coordinates: {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      },
      locationDetected: true,
      fullAddress: data.display_name,
      raw: data // Include raw response for debugging
    };

    res.json({
      success: true,
      data: locationData,
    });
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get address from coordinates",
      error: error.message,
    });
  }
});

module.exports = router;
