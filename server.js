const http = require('http');
const qrgenModule = require('facturacionelectronicapy-qrgen');
const qrgen = qrgenModule.default;
const fs = require('fs');
const winston = require('winston');

// Configuración del puerto en el que el servidor escuchará
const PORT = 3002;

console.log(`Servidor iniciado en http://localhost:${PORT}`);

// Configurar Winston para logging
const logger = winston.createLogger({
    level: 'info', // Nivel de logs a registrar
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' // Formato de timestamp
        }),
        winston.format.printf(info => `${info.timestamp} - ${info.level.toUpperCase()} - ${info.message}`)
    ),
    transports: [
        new winston.transports.File({ filename: 'errores.log', level: 'error' }), // Transporte para errores
        new winston.transports.File({ filename: 'info.log' }) // Transporte para información
    ]
});

// Variable para almacenar el XML recibido
let xmlSigned = '';

// Función que maneja las solicitudes entrantes
const requestHandler = (req, res) => {
    if (req.method === 'POST' && req.headers['content-type'] === 'application/xml') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            xmlSigned = body;
            logger.info('XML recibido correctamente');

            // Generar el QR para el XML firmado
            if (typeof qrgen.generateQR === 'function') {
                qrgen.generateQR(xmlSigned)
                    .then(xmlConQR => {
                        logger.info('QR XML generado');
                        // Loggear el XML con QR generado
                        logger.info(`qr XML: ${xmlConQR}`);

                        // Responder al cliente con un JSON que incluye el mensaje y el XML
                        const response = {
                            message: "QR generado correctamente",
                            xml: xmlConQR
                        };
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(response, null, 2));
                        console.log("XML con QR generado correctamente:", xmlConQR)
                    })
                    .catch(error => {
                        logger.error('Error al generar XML con QR:', error);
                        // Enviar un objeto JSON con el mensaje de error
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Error al generar XML con QR', message: error.message }));
                    });
            } else {
                logger.error("generateQR no es una función disponible en qrgen");
                // Enviar un objeto JSON con el mensaje de error
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error interno del servidor' }));
            }
        });
    } else {
        logger.error('Solicitud incorrecta recibida');
        // Enviar un objeto JSON con el mensaje de error
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Solo se aceptan solicitudes POST con contenido XML' }));
    }
};

// Creación del servidor HTTP
const server = http.createServer(requestHandler);

// El servidor empieza a escuchar en el puerto especificado
server.listen(PORT, (err) => {
    if (err) {
        logger.error(`Error al iniciar el servidor: ${err.message}`);
        return console.error('Error al iniciar el servidor:', err);
    }
    logger.info(`Servidor escuchando en el puerto ${PORT}`);
});
