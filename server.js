const http = require('http');
const qrgenModule = require('facturacionelectronicapy-qrgen');
const qrgen = qrgenModule.default || qrgenModule;
const fs = require('fs');
const { eventLogger, errorLogger } = require('./logger'); // Importamos los loggers desde logger.js

const PORT = 3003;

console.log(`Servidor iniciado en http://localhost:${PORT}`);

const requestHandler = (req, res) => {
    if (req.method === 'POST' && req.headers['content-type'] === 'application/xml') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const xmlSigned = body;
            eventLogger.info('XML recibido correctamente');

            if (typeof qrgen.generateQR === 'function') {
                qrgen.generateQR(xmlSigned)
                    .then(xmlConQR => {
                        eventLogger.info('QR XML generado');
                        eventLogger.info(`QR XML: ${xmlConQR}`);

                        const response = {
                            message: "QR generado correctamente",
                            xml: xmlConQR
                        };
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(response, null, 2));
                        console.log("XML con QR generado correctamente:", xmlConQR)
                    })
                    .catch(error => {
                        errorLogger.error('Error al generar XML con QR:', error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Error al generar XML con QR', message: error.message }));
                    });
            } else {
                errorLogger.error("generateQR no es una función disponible en qrgen");
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error interno del servidor' }));
            }
        });
    } else {
        errorLogger.error('Solicitud incorrecta recibida');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Solo se aceptan solicitudes POST con contenido XML' }));
    }
};

const server = http.createServer(requestHandler);

server.listen(PORT, (err) => {
    if (err) {
        errorLogger.error(`Error al iniciar el servidor: ${err.message}`);
        return console.error('Error al iniciar el servidor:', err);
    }
    eventLogger.info(`Servidor escuchando en el puerto ${PORT}`);
});
