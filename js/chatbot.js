// ⚠️ ATENCIÓN: DEBES PEGAR LA URL DE TU FUNCIÓN AQUÍ
const APPWRITE_FUNCTION_URL = 'https://cloud.appwrite.io/v1/functions/691d43a0001aa8bb49da/executions';

document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.getElementById('chatWindow');
    const floatingBtn = document.querySelector('.floating-chat');
    const closeBtn = document.getElementById('closeChat');
    const sendBtn = document.getElementById('sendBtn');
    const userInput = document.getElementById('userInput');
    const chatBody = document.getElementById('chatBody');

    if (!chatWindow || !floatingBtn || !closeBtn || !sendBtn || !userInput || !chatBody) return;

    // =================================================================
    // (CONOCIMIENTO_BOT y RESPUESTA_DEFAULT se mantienen iguales)
    // ...
    // =================================================================
    // (Funciones de PERSISTENCIA y UI (toggleChat, guardarMensaje, etc.) deben estar aquí)
    // ...

    // Función clave para mejorar la inteligencia de las palabras clave (FIX DE RIGIDEZ)
    function normalizarEntrada(texto) {
        let temp = texto.toLowerCase();
        temp = temp.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Quita acentos
        temp = temp.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()¡¿?"]/g,""); // Quita puntuación
        return temp.trim();
    }


    // =================================================================
    // 🕵️‍♀️ LÓGICA ASÍNCRONA DE IA (REEMPLAZO COMPLETO)
    // =================================================================
    
    // ⚠️ Esta función debe ser ASÍNCRONA
    async function encontrarRespuesta(input) {
        const text = normalizarEntrada(input); // ⬅️ FIX: NORMALIZACIÓN APLICADA
        contextoBot = null; 
        
        // 1. CHEQUEO RÁPIDO LOCAL (Horarios, Ubicación, Reciclaje - Instantáneo)
        for (let key in CONOCIMIENTO_BOT) {
            if (CONOCIMIENTO_BOT[key].keywords.some(k => text.includes(CONOCIMIENTO_BOT[key].keywords))) {
                const info = CONOCIMIENTO_BOT[key];
                contextoBot = key; 
                
                if (info.tipo !== "dinamico_eventos") { // Respuestas hardcodeadas (rápidas)
                     return info.respuesta;
                }
            }
        }
        
        // 2. LLAMADA AL SERVIDOR DE IA (Appwrite Function)
        try {
            const response = await fetch(APPWRITE_FUNCTION_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: input }) 
            });

            const data = await response.json();

            if (data.status === 'success' && data.respuestaIA) {
                // Si la IA responde correctamente, devuelve su texto.
                return data.respuestaIA; 
            } else {
                return "<p>⚠️ ¡Error! El servidor de IA no pudo generar una respuesta.</p>"; 
            }
        } catch (error) {
            console.error("Error de conexión con Appwrite Function:", error);
            return "<p>⚠️ Error de red. No pude contactar con el asistente de IA.</p>";
        }
        
        return RESPUESTA_DEFAULT; 
    }

    // ----------------------------------------------------
    // Modificar HANDLE SEND para usar ASYNC/AWAIT y Carga
    // ----------------------------------------------------
    // ⚠️ Esta función debe ser ASÍNCRONA
    function handleSend(text = null) {
        const msg = text || userInput.value.trim();
        if (!msg) return;

        addMessage(msg, 'user', false, true); 
        userInput.value = '';
        
        // ⬅️ El setTimeout DEBE envolver una función ASÍNCRONA
        setTimeout(async () => { 
            // 1. Mostrar mensaje de carga (Temporal)
            const tempMsg = document.createElement('div');
            tempMsg.classList.add('message', 'bot-message', 'loading-msg');
            tempMsg.innerHTML = '<p>🤖 Escribiendo respuesta...</p>';
            chatBody.appendChild(tempMsg);
            // NOTA: Se requiere la función smartScroll() para que esto se vea bien.

            const respuestaBot = await encontrarRespuesta(msg); // 2. ESPERAR RESULTADO DE LA IA
            
            // 3. Quitar mensaje de carga
            tempMsg.remove(); 

            // 4. Mostrar respuesta de la IA
            addMessage(respuestaBot, 'bot', true, true); 
        }, 500);
    }

    sendBtn.addEventListener('click', () => handleSend());
    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });

    // Inicialización al cargar la página
    cargarHistorial();
});