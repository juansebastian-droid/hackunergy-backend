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

    let contactId;
    if (contactRes.status === 409 && newContact.category === 'CONFLICT') {
      const match = newContact.message.match(/Existing ID: (\d+)/);
      if (!match) throw new Error(`Contacto duplicado pero no se pudo extraer ID: ${newContact.message}`);
      contactId = match[1];
      console.log('contacto ya existía, usando ID:', contactId);
    } else if (!contactRes.ok) {
      throw new Error(`Error HubSpot al crear contacto: ${JSON.stringify(newContact)}`);
    } else {
      contactId = newContact.id;
    }

    await fetch('https://api.hubapi.com/crm/v3/associations/contacts/companies/batch/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({
        inputs: [{
          from: { id: contactId },
          to: { id: companyId },
          type: 'contact_to_company'
        }]
      })
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'SUCCESS', contactId })
    };

  } catch (error) {
    console.log('error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ status: 'ERROR', message: error.message })
    };
  }
};