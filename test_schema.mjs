import('dotenv').then(async ({config}) => {
  config();
  const res = await fetch(process.env.VITE_SUPABASE_URL + '/graphql/v1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
      Authorization: 'Bearer ' + process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    },
    body: JSON.stringify({query: '{ __schema { types { name } } }'})
  });
  const json = await res.json();
  if(json.data) {
    const types = json.data.__schema.types.map(t => t.name).filter(n => !n.startsWith('__'));
    console.log('Tables:', types);
  } else {
    console.log('Error:', json);
  }
});
