import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { companyName, industry, contactPerson, problems, solution } = await request.json();

    const prompt = `
    You are an expert software sales representative for Codentra Technologies.
    Write a highly personalized, concise outreach email to this lead.
    
    Company: ${companyName || 'Unknown'}
    Industry: ${industry || 'Unknown'}
    Contact Person: ${contactPerson || "Founder/CEO"}
    
    Problems Identified: ${problems || 'None specifically identified'}
    Recommended Solution from Codentra: ${solution || 'Our lead generation AI software'}
    
    The email must mention their specific problems and how Codentra's specific solution can help them. 
    Keep it professional but conversational.
    
    Return ONLY valid JSON in this format without any markdown code blocks:
    {
        "subject": "The email subject",
        "body": "The email body..."
    }
    `;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ detail: "GEMINI_API_KEY not configured in frontend .env.local" }, { status: 500 });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(data);
      throw new Error(data.error?.message || "Failed to generate content from Gemini API");
    }

    let rawText = data.candidates[0].content.parts[0].text.trim();
    if (rawText.startsWith("\`\`\`json")) {
      rawText = rawText.substring(7, rawText.length - 3).trim();
    } else if (rawText.startsWith("\`\`\`")) {
        rawText = rawText.substring(3, rawText.length - 3).trim();
    }

    const parsed = JSON.parse(rawText);

    return NextResponse.json({
      subject: parsed.subject,
      body: parsed.body
    });

  } catch (error: any) {
    console.error("Email generation error:", error);
    return NextResponse.json({ detail: error.message || "Failed to generate email" }, { status: 500 });
  }
}
