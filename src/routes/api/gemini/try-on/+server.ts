import { json } from '@sveltejs/kit';
import * as gemini from '$lib/server/gemini.server';

// Image generation + 503-retries can take a while — give the function room.
export const config = { maxDuration: 60 };

export const POST = async ({ request }) => {
  try {
    const { userImg, productImg } = await request.json();
    const data = await gemini.generateTryOnTransformation(userImg, productImg);
    return json({ image: data });
  } catch (error: any) {
    return json({ error: error.message }, { status: 500 });
  }
};
