---
mazo: Sistemas Operativos - Primer Parcial
emoji: 🖥️
---

Q: ¿Qué es un Sistema Operativo?
A: |
  Conjunto de programas que actúa como **intermediario entre el usuario y el hardware**.
  Administra los recursos del sistema (CPU, memoria, E/S, almacenamiento) y proporciona una plataforma para ejecutar aplicaciones, ocultando la complejidad del hardware.

---

Q: Describe las funciones del Sistema Operativo
A: |
  - **Procesos:** crear, planificar, ejecutar y terminar
  - **Memoria:** asignar y liberar memoria
  - **E/S:** controlar dispositivos
  - **Archivos:** crear, leer, escribir y organizar
  - **Seguridad y protección:** controlar el acceso a recursos
  - **Interfaz de usuario:** CLI o GUI
  - **Red:** gestionar comunicaciones

---

Q: Menciona las clasificaciones de los Sistemas Operativos
A: |
  - **Por usuarios:** monousuario / multiusuario
  - **Por tareas:** monotarea / multitarea
  - **Por procesadores:** monoprocesador / multiprocesador
  - **Por tiempo de respuesta:** tiempo real / tiempo compartido / por lotes
  - **Por estructura:** monolítico / capas / microkernel / máquina virtual

---

Q: ¿En qué año fue creado UNIX y en qué laboratorios?
A: |
  En **1969**, en los **Laboratorios Bell (AT&T)**.
  Lo desarrollaron **Ken Thompson y Dennis Ritchie**; primero en ensamblador y luego reescrito en C, lo que lo hizo portable.

---

Q: Describe 5 características del Sistema Operativo UNIX
A: |
  - **Multitarea:** varios procesos a la vez
  - **Multiusuario:** varios usuarios simultáneos
  - **Seguro:** sistema de permisos y control de acceso
  - **Estable:** funciona largos periodos sin reiniciar
  - **Robusto:** resistente a fallos
  También es portable (escrito en C) y tiene un sistema de archivos jerárquico.

---

Q: Menciona 5 Sistemas Operativos para dispositivos móviles
A: |
  - **Android** (Google, basado en Linux)
  - **iOS** (Apple)
  - **Symbian** (Nokia)
  - **BlackBerry OS** (RIM)
  - **Windows Phone** (Microsoft)

---

Q: ¿En qué año fundó Steve Jobs Apple y cuál era su nombre completo?
A: |
  Apple se fundó en **1976** (1 de abril).
  Nombre completo: **Steven Paul Jobs**.
  Cofundadores: Steve Wozniak y Ronald Wayne, en el garaje de Jobs en Los Altos, California.

---

Q: Describe 3 productos que creó Steve Jobs
A: |
  - **Macintosh (1984):** primera computadora personal exitosa con interfaz gráfica y ratón
  - **iPod (2001):** reproductor de música portátil; junto con iTunes transformó la industria musical
  - **iPhone (2007):** smartphone con pantalla táctil que redefinió la telefonía móvil
  Otros: Apple I, Apple II, iMac, iPad.

---

Q: Describe las 5 generaciones de las computadoras
A: |
  - **1a (1940-1956):** tubos de vacío (bulbos). ENIAC, UNIVAC. Tarjetas perforadas
  - **2a (1956-1963):** transistores. Más pequeñas y confiables. COBOL, FORTRAN
  - **3a (1963-1971):** circuitos integrados. Multiprogramación. IBM 360
  - **4a (1971-presente):** microprocesadores. Computadoras personales, GUI, redes
  - **5a (actual):** inteligencia artificial, procesamiento paralelo

---

Q: ¿Qué es Software Libre y qué es Software de Licencia (de patente)?
A: |
  **Software libre:** se puede usar, estudiar, modificar y redistribuir; el código fuente está disponible. Ej: Linux, LibreOffice, Firefox.
  **Software de licencia (propietario):** el código fuente no está disponible; requiere licencia (generalmente de pago) y no se puede modificar ni redistribuir sin autorización. Ej: Windows, Microsoft Office.

---

Q: Describe 5 distribuciones del Sistema Operativo Linux
A: |
  - **Ubuntu:** basada en Debian, fácil de usar (Canonical)
  - **Fedora:** patrocinada por Red Hat, tecnología de vanguardia
  - **Debian:** de las más antiguas y estables, base de muchas otras
  - **OpenSuSE:** de origen alemán, se configura con YaST
  - **Slackware:** de las primeras distribuciones, para usuarios avanzados
  Otra: **Android** usa el kernel Linux.

---

Q: Describe la evolución de las versiones de Windows
A: |
  - **Windows 1.0 (1985):** interfaz gráfica sobre MS-DOS
  - **Windows 3.1 (1992):** gran mejora gráfica
  - **Windows 95 (1995):** menú Inicio y barra de tareas
  - **Windows XP (2001):** basado en NT, muy estable
  - **Windows 7 (2009):** corrigió los problemas de Vista
  - **Windows 10 (2015):** regresa el menú Inicio
  - **Windows 11 (2021):** barra centrada, requiere TPM 2.0
  Servidor: Windows Server 2003, 2008, 2012, 2016, 2019, 2022.

---

Q: ¿Qué es un Sistema Distribuido?
A: |
  Conjunto de **computadoras independientes conectadas en red** que se coordinan y aparentan ser **un solo sistema** para el usuario.
  Características: compartición de recursos, transparencia, tolerancia a fallos, escalabilidad, comunicación por paso de mensajes.

---

Q: ¿Qué es una Máquina Virtual?
A: |
  **Emulación por software** de una computadora física; permite ejecutar un sistema operativo completo dentro de otro (anfitrión).
  - **De sistema:** VMware, VirtualBox, Hyper-V
  - **De proceso:** JVM de Java
  Ventajas: aislamiento, pruebas seguras, varios SO en un equipo.

---

Q: ¿Qué es la memoria? Describe sus tipos
A: |
  Dispositivo que almacena datos e instrucciones de forma temporal o permanente.
  **Primaria:** registros, caché, RAM, ROM
  **Secundaria:** disco duro, SSD, USB, cintas magnéticas, discos flexibles

---

Q: ¿Qué es la memoria RAM? Describe sus características
A: |
  **Random Access Memory** (memoria de acceso aleatorio).
  - **Volátil:** pierde su contenido al apagar
  - Lectura y escritura
  - Acceso directo a cualquier posición
  - Trabaja con la CPU mediante el **bus de datos** y el **bus de direcciones**
  - Guarda los programas y datos en ejecución

---

Q: ¿Cuáles son las diferencias entre DDR, DDR2, DDR3, DDR4 y DDR5?
A: |
  - **DDR:** 2.5 V, 184 pines
  - **DDR2:** 1.8 V, 240 pines
  - **DDR3:** 1.5 V, 240 pines
  - **DDR4:** 1.2 V, 288 pines
  - **DDR5:** 1.1 V, 288 pines
  Cada generación: **menor voltaje**, **mayor velocidad** y **mayor capacidad**. No son compatibles entre sí (la muesca está en otra posición).

---

Q: ¿Qué es la memoria ROM? Describe sus características
A: |
  **Read Only Memory** (memoria de solo lectura).
  - **No volátil:** conserva la información sin energía
  - Contiene el **BIOS** (firmware de arranque)
  - Almacena las características del sistema
  Tipos: PROM, EPROM (se borra con luz UV), EEPROM/Flash (se borra eléctricamente).

---

Q: ¿Qué es la memoria caché?
A: |
  Memoria auxiliar de **alta velocidad** ubicada **entre la CPU y la RAM**.
  Guarda copias de los datos que se usan con más frecuencia para que la CPU no espere a la RAM.
  Niveles: **L1** (la más rápida y pequeña), **L2**, **L3** (la más grande, compartida).

---

Q: Ordena la jerarquía de memoria de la más rápida a la más lenta
A: |
  **Registros → Caché → RAM → Disco (secundaria)**
  Al bajar en la jerarquía aumenta la capacidad y baja el costo por bit, pero disminuye la velocidad.

---

Q: ¿Qué es la memoria virtual (swap)? ¿Cuánto es el mínimo y cuánto lo recomendado?
A: |
  Espacio en **disco** que se usa como extensión de la RAM cuando esta se llena.
  - **Mínimo:** igual al tamaño de la RAM (1x)
  - **Recomendado:** el doble de la RAM (2x)
  Ej: con 8 GB de RAM → mínimo 8 GB, recomendado 16 GB.

---

Q: ¿Qué es la asignación contigua de memoria?
A: |
  Cada proceso se carga en **un solo bloque continuo** de memoria.
  Tipos: partición única, particiones estáticas (fijas) y particiones dinámicas.
  Ventaja: sencilla. Desventaja: fragmentación.

---

Q: Describe el particionamiento estático
A: |
  La memoria se divide en **particiones de tamaño fijo** al arrancar el sistema.
  - Cada partición aloja un proceso
  - Puede usar **colas múltiples** (una por partición) o una cola única
  **Ventaja:** simple, poca carga para el SO
  **Desventaja:** **fragmentación interna**, número fijo de procesos y tamaño máximo limitado

---

Q: Describe el particionamiento dinámico
A: |
  Las particiones se crean **del tamaño exacto del proceso al cargarlo** en memoria.
  **Ventaja:** no hay fragmentación interna, mejor uso de la memoria
  **Desventaja:** **fragmentación externa** (huecos pequeños entre procesos); necesita compactación y algoritmos de asignación

---

Q: ¿Qué es la fragmentación interna y la externa?
A: |
  **Interna:** espacio desperdiciado **dentro** de una partición porque el proceso es más pequeño que ella. Ocurre en el particionamiento estático y en la paginación.
  **Externa:** hay suficiente memoria libre en total, pero **no contigua** (huecos dispersos). Ocurre en el particionamiento dinámico y en la segmentación.

---

Q: ¿Qué es la compactación de memoria?
A: |
  Mover los procesos en memoria para **juntar todos los huecos libres en un solo bloque**.
  Resuelve la **fragmentación externa**, pero es costosa en tiempo porque hay que detener y reubicar procesos.

---

Q: ¿Qué algoritmos de asignación de memoria existen?
A: |
  - **First Fit (primer ajuste):** el primer hueco suficientemente grande; es el más rápido
  - **Best Fit (mejor ajuste):** el hueco más pequeño que alcance; deja fragmentos muy pequeños
  - **Worst Fit (peor ajuste):** el hueco más grande; el sobrante queda utilizable

---

Q: ¿Qué es la paginación?
A: |
  Divide la memoria física en **marcos** (frames) y el proceso en **páginas** del mismo tamaño fijo.
  Las páginas se cargan en cualquier marco libre, **no necesariamente contiguo**. Una **tabla de páginas** relaciona cada página con su marco.
  Dirección lógica = número de página + desplazamiento.
  Elimina la fragmentación externa (puede quedar fragmentación interna en la última página).

---

Q: ¿Qué es la segmentación?
A: |
  Divide el proceso en **segmentos de tamaño variable** que corresponden a partes lógicas del programa (código, datos, pila).
  Una **tabla de segmentos** guarda la base y el límite de cada uno.
  Dirección lógica = número de segmento + desplazamiento.
  Produce **fragmentación externa**.

---

Q: Describe los algoritmos de reemplazo de páginas FIFO, LRU y Óptimo
A: |
  - **FIFO:** reemplaza la página que lleva **más tiempo en memoria**. Simple; puede presentar la anomalía de Belady
  - **LRU:** reemplaza la página que **lleva más tiempo sin usarse**
  - **Óptimo:** reemplaza la página que **tardará más en volver a usarse**. Es el que menos fallos produce, pero no se puede implementar (requiere conocer el futuro); sirve como referencia

---

Q: ¿Cómo se llama el ingeniero que imparte Sistemas Operativos?
A: **Ing. Ángel Isidro Mercado** (Facultad de Ingeniería, UNAM, Grupo 01)
