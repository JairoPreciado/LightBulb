const nodemailer = require('nodemailer');

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Host del servidor SMTP de Gmail
    port: 465, // Puerto para conexiones seguras (SSL)
    secure: true, // true para usar SSL, false para usar TLS o STARTTLS
    auth: {
      user: 'preciadojairo82@gmail.com', // Tu correo
      pass: 'fgfv fcnt cwqr rwva', // Contraseña de la aplicación
    },
  });

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, code } = req.body;

    try {
      await transporter.sendMail({
        from: '"Lightbulb Support" <preciadojairo82@gmail.com>',
        to: email,
        subject: 'Tu código de verificación',
        text: `Hola, tu código de verificación es: ${code}`,
      });

      res.status(200).json({ message: 'Correo enviado exitosamente' });
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      res.status(500).json({ error: 'Error al enviar el correo' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
