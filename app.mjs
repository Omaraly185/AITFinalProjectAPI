import express from "express";
import { google } from "googleapis";
import keys from "./the-scheduling-app.json" assert { type: "json" };
import cors from "cors";
import moment from "moment";
import nodemailer from "nodemailer";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

async function sendMail({ to, subject, text }) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "obreezy1965@gmail.com",
      pass: "jzuhjiuyjhjffbtk",
    },
  });
  let info = await transporter.sendMail({
    from: "Omar Aly",
    to: to,
    subject: subject,
    text: text,
  });

  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}

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
  const { selectedDate, selectedTime, description, email, name, phoneNumber } =
    req.body;
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
    const eventEndTime = moment(eventStartTime).add(1, "hours");

    const event = {
      summary: "Appointment",
      start: { dateTime: eventStartTime.toISOString() },
      end: { dateTime: eventEndTime.toISOString() },
      description: description,
    };

    const createdEvent = await calendar.events.insert({
      calendarId: "obreezy1965@gmail.com",
      resource: event,
    });

    console.log("Created event:", createdEvent.data);

    await sendMail({
      to: "obreezy1965@gmail.com",
      subject: `Event Created for ${name} Successfully`,
      text: `Hi,
              Great news! Someone just booked an appointment.
            Here are the details:

            Info
    Name: ${name}
    Email: ${email}
    Phone Number: ${phoneNumber}

    `,
    });
    await sendMail({
      to: email,
      subject: "Confirmation: Your Appointment with Omar Aly",
      text: `Dear ${name},

        Thank you for scheduling a meeting at:

        **Date:** ${selectedDate}
        **Time:** ${selectedTime}

        I will reach out shortly to verify the details and answer any questions you might have.

        If you need to make any changes to your appointment or if you have any inquiries, please don't hesitate to contact me

        I look forward to meeting with you

        Warm regards,

        Omar
      `,
    });
    res
      .status(200)
      .json({ success: true, message: "Appointment created successfully" });
  } catch (err) {
    console.error("Error creating event:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to create appointment" });
  }
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
