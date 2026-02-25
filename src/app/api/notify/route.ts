import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_test_xxxxxxxx");

export async function POST(request: Request) {
    try {
        const { email, subject, score, targetSqm } = await request.json();

        const data = await resend.emails.send({
            from: "Interstellar Astro <onboarding@resend.dev>",
            to: [email],
            subject: subject || "Astro Quality Update",
            html: `
        <div>
          <h1>Interstellar Observation Alert</h1>
          <p>Current Astro Score: <strong>${score} / 100</strong></p>
          <p>Target SQM: <strong>${targetSqm} mag/arcsec²</strong></p>
          <p>Conditions are favorable for your observation session today.</p>
        </div>
      `,
        });

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
