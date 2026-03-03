exports.handler = async (event) => {
  console.log('body recibido:', event.body);
  
  const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  const { companyId, contact } = body;
  const TOKEN = process.env.PRIVATE_APP_ACCESS_TOKEN;

  try {
    const contactRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({
        properties: {
          firstname: contact.name,
          lastname: contact.lastName,
          email: contact.email,
          phone: String(contact.cellphone),
          jobtitle: contact.rol
        }
      })
    });

    const newContact = await contactRes.json();
    console.log('contacto creado:', newContact);

    await fetch('https://api.hubapi.com/crm/v3/associations/contacts/companies/batch/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({
        inputs: [{
          from: { id: newContact.id },
          to: { id: companyId },
          type: 'contact_to_company'
        }]
      })
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'SUCCESS', contactId: newContact.id })
    };

  } catch (error) {
    console.log('error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ status: 'ERROR', message: error.message })
    };
  }
};