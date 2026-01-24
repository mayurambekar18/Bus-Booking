import express from "express";
import cors from "cors";
import connectDB from "./db.js";
import { ObjectId } from "mongodb";

const app = express();
app.use(cors());
app.use(express.json());

let db;
connectDB().then(database => {
  db = database;
  console.log("MongoDB Connected");

  // Index (TYIT requirement)
  db.collection("bookings").createIndex({ busNo: 1 });
});

/* ================= BOOK TICKET ================= */
app.post("/book", async (req, res) => {
  try {
    const {
      busNo,
      busType,
      fare,
      seat,
      passengerName,
      mobile,
      journeyDate
    } = req.body;

    // Validation
    if (
      !busNo ||
      !busType ||
      !fare ||
      !seat ||
      !passengerName ||
      !mobile ||
      !journeyDate
    ) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Prevent duplicate seat booking (same bus + same date)
    const exists = await db.collection("bookings").findOne({
      busNo,
      seat: Number(seat),
      journeyDate
    });

    if (exists) {
      return res.status(400).json({ message: "Seat already booked" });
    }

    // Insert booking
    await db.collection("bookings").insertOne({
      busNo,
      busType,
      fare: Number(fare),
      seat: Number(seat),
      passengerName,
      mobile,
      journeyDate,
      bookingTime: new Date()
    });

    res.json({ message: "Booking successful" });

  } catch (err) {
    console.error("BOOK ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET ALL BUSES (MASTER) ================= */
app.get("/buses", async (req, res) => {
  console.log("/buses API CALLED");

  if (!db) {
    console.log("DB NOT READY");
    return res.json([]);
  }

  const buses = await db.collection("buses").find().toArray();
  console.log("DATA FROM DB:", buses);

  res.json(buses);
});

app.get("/bookings", async (req, res) => {
  try {
    const bookings = await db.collection("bookings").find().toArray();
    res.json(bookings);
  } catch (err) {
    console.error("FETCH BOOKINGS ERROR:", err);
    res.status(500).json({ message: "Error fetching bookings" });
  }
});
/* ================= FILTER BOOKINGS ================= */
app.get("/searchBookings", async (req, res) => {
  console.log("🔥 /searchBookings API CALLED");

  const { busNo, journeyDate } = req.query;

  console.log("QUERY RECEIVED:", req.query);

  let filter = {};
  if (busNo) filter.busNo = busNo;
  if (journeyDate) filter.journeyDate = journeyDate;

  console.log("FILTER USED:", filter);

  const data = await db.collection("bookings").find(filter).toArray();

  console.log("DATA RETURNED:", data);

  res.json(data);
});

/* ================= UPDATE BOOKING ================= */
app.put("/update", async (req, res) => {
  const { id, seat } = req.body;

  await db.collection("bookings").updateOne(
    { _id: new ObjectId(id) },
    { $set: { seat: Number(seat) } }
  );

  res.json({ success: true });
});

/* ================= DELETE BOOKING ================= */
app.delete("/delete/:id", async (req, res) => {
  await db.collection("bookings").deleteOne({
    _id: new ObjectId(req.params.id)
  });

  res.json({ success: true });
});

/* ================= AGGREGATION ================= */
app.get("/stats", async (req, res) => {
  const data = await db.collection("bookings").aggregate([
    { $group: { _id: "$busNo", totalBookedSeats: { $sum: 1 } } }
  ]).toArray();

  res.json(data);
});

app.listen(5000, () =>
  console.log("Server running on http://localhost:5000")
);
