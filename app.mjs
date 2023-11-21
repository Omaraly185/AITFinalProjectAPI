import express from "express";
import { google } from "googleapis";
import keys from "./the-scheduling-app.json" assert { type: "json" };
import cors from "cors";
import moment from "moment";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const port = process.env.PORT || 4000;
const jwtClient = new google.auth.JWT({
  email: keys.client_email,
  key: keys.private_key,
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

jwtClient.authorize((err, tokens) => {
  if (err) {
    console.error("Error during authorization:", err);
    return;
  }
  console.log("Authorization successful!");
});

app.get("/events", async (req, res) => {
  const calendar = google.calendar({ version: "v3", auth: jwtClient });

  let response;
  try {
    response = await calendar.events.list({
      calendarId: "obreezy1965@gmail.com",
      timeMin: new Date().toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 9999,
    });
    console.log("Fetched events:", response.data.items);
    const events = response.data.items.map((event) => ({
      title: event.summary || "",
      start: new Date(event.start.dateTime || event.start.date),
      end: new Date(event.end.dateTime || event.end.date),
    }));
    res.json(events);
  } catch (err) {
    console.error("Error fetching events list:", err);
    res.status(500).send("Error fetching events list: " + err);
  }
});
app.post("/events", async (req, res) => {
  const { selectedDate, selectedTime, description } = req.body;

  if (!selectedDate || !selectedTime) {
    return res.status(400).json({
      success: false,
      message: "Invalid request: missing selectedDate or selectedTime",
    });
  }

  const calendar = google.calendar({ version: "v3", auth: jwtClient });

  try {
    const eventStartTime = moment(
      `${selectedDate} ${selectedTime}`,
      "MMMM D, YYYY h:mm A"
    );
    const eventEndTime = moment(eventStartTime).add(1, "hours"); // Adding 1 hour to the start time

    const event = {
      summary: "Appointment",
      start: { dateTime: eventStartTime.toISOString() },
      end: { dateTime: eventEndTime.toISOString() }, // Using the calculated end time
      description: description,
    };

    const createdEvent = await calendar.events.insert({
      calendarId: "obreezy1965@gmail.com",
      resource: event,
    });

    console.log("Created event:", createdEvent.data);
    res.status(200).json({
      success: true,
      message: "Event created",
      event: createdEvent.data,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while creating the event",
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
