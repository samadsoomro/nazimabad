import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: ContactEmailRequest = await req.json();

    console.log("Sending confirmation email to:", email);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "GCMN Library <onboarding@resend.dev>",
        to: [email],
        subject: "We received your message - GCMN Library",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0c1d32 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">GCMN Library</h1>
              <p style="color: #b8d4f0; margin: 10px 0 0 0;">Gov. College For Men Nazimabad</p>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
              <h2 style="color: #1e3a5f; margin-top: 0;">Thank you for contacting us, ${name}!</h2>
              
              <p>We have received your message and our team will review it shortly. We typically respond within 1-2 business days.</p>
              
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1e3a5f; margin-top: 0; font-size: 16px;">Your Message Details:</h3>
                <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
                <p style="margin: 5px 0;"><strong>Message:</strong></p>
                <p style="margin: 5px 0; padding: 10px; background: #ffffff; border-radius: 4px;">${message}</p>
              </div>
              
              <p>If you have any urgent queries, please visit us during office hours:</p>
              <ul style="color: #666;">
                <li>Mon–Fri: 9:00 AM – 1:00 PM</li>
                <li>Sat: 9:00 AM – 12:00 PM</li>
              </ul>
              
              <p style="margin-top: 30px;">Best regards,<br><strong>GCMN Library Team</strong></p>
            </div>
            
            <div style="background: #1e3a5f; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
              <p style="color: #b8d4f0; margin: 0; font-size: 12px;">
                © ${new Date().getFullYear()} Gov. College For Men Nazimabad Library<br>
                Nazimabad, Karachi, Pakistan
              </p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailResponse = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", emailResponse);
      throw new Error(emailResponse.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-confirmation function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
