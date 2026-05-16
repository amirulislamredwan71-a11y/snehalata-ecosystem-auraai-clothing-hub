import { json } from '@sveltejs/kit';
import * as gemini from '$lib/server/gemini.server';

export const POST = async ({ request }) => {
  try {
    const { userImg, productImg } = await request.json();
    const data = await gemini.generateTryOnTransformation(userImg, productImg);
    return json({ image: data });
  } catch (error: any) {
    return json({ error: error.message }, { status: 500 });
  }
};
