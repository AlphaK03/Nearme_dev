# NearMe

La aplicación web actual está en `web/` (React/Leaflet), con API Node.js en `backend/src/`. Desde la raíz: `npm run build` y `npm start`; abrir http://127.0.0.1:8787. Para GPS e instalación en móviles, ver la [guía de pruebas HTTPS con Visual Studio Code](docs/mobile-testing.md). `frontend/` conserva el cliente Flutter anterior; las secciones siguientes describen el planteamiento académico original.

NearMe es un proyecto universitario desarrollado para el curso **Aplicaciones Globales**. Su objetivo es crear una aplicación multiplataforma capaz de recomendar lugares cercanos y generar itinerarios personalizados de acuerdo con los intereses, ubicación, tiempo disponible y distancia máxima que el usuario desea recorrer.

El proyecto se plantea como un **MVP académico**, por lo que su prioridad es demostrar correctamente la arquitectura, integración de servicios, experiencia de usuario y funcionamiento de las características principales, sin intentar cubrir todas las funciones de una aplicación comercial.

## Idea principal

NearMe ayuda a una persona que se encuentra en una ciudad o zona que no conoce a responder preguntas como:

- ¿Qué lugares interesantes hay cerca de mí?
- ¿Qué puedo visitar según mis gustos?
- ¿Qué puedo hacer con el tiempo que tengo disponible?
- ¿Qué recorrido aprovecha mejor mi ubicación y distancia máxima?
- ¿Qué itinerarios han sido bien valorados por personas con intereses similares?

La aplicación podrá generar un itinerario inicial y, posteriormente, permitir su actualización cuando cambie el tiempo disponible o la ubicación del usuario.

## Objetivo general

Desarrollar una aplicación multiplataforma que genere itinerarios personalizados mediante servicios de geolocalización, mapas e Inteligencia Artificial, considerando las preferencias, ubicación, tiempo disponible y distancia máxima definida por el usuario.

## Objetivos específicos

- Permitir el registro e inicio de sesión de usuarios.
- Gestionar preferencias e intereses personales.
- Obtener la ubicación actual del usuario.
- Consultar lugares cercanos según categorías de interés.
- Generar itinerarios personalizados.
- Mostrar lugares y recorridos mediante mapas.
- Permitir que los usuarios valoren lugares o itinerarios.
- Utilizar valoraciones de usuarios con intereses similares para mejorar futuras recomendaciones.
- Permitir recalcular un itinerario utilizando el tiempo restante y la ubicación actual.

## Alcance del MVP

La primera versión del proyecto contempla:

- Registro e inicio de sesión.
- Perfil básico de usuario.
- Selección de intereses.
- Geolocalización.
- Consulta de lugares cercanos.
- Generación de itinerarios.
- Visualización de información de los lugares.
- Visualización del recorrido en mapa.
- Valoración de experiencias.
- Recomendaciones básicas basadas en preferencias y valoraciones.
- Recalculo manual del itinerario.

### Fuera del alcance inicial

Para mantener un alcance realista dentro del curso, inicialmente no se contempla:

- Reservas de hoteles.
- Compra de boletos.
- Compra de vuelos.
- Pagos dentro de la aplicación.
- Integraciones con aerolíneas.
- Monitoreo continuo de tráfico.
- Seguimiento GPS permanente en segundo plano.
- Machine Learning avanzado entrenado por el equipo.
- Funcionalidades comerciales completas.

Estas características pueden considerarse como mejoras futuras.

## Tecnologías

### Aplicación multiplataforma

- **Flutter**
- **Dart**

Flutter permite mantener una única base de código para diferentes plataformas.

Plataformas objetivo del proyecto:

- Android
- iOS
- Web

> Nota: el desarrollo puede realizarse desde Windows para Android y Web. Para compilar y probar una aplicación nativa de iOS se requiere macOS con Xcode.

### Backend y base de datos

- **Supabase**
- **PostgreSQL**
- **Supabase Auth**

Supabase se utilizará para simplificar la infraestructura académica del proyecto y centralizar autenticación, persistencia de datos y servicios backend.

### Servicios externos

- **Google Maps Platform**
- **Google Places API**
- **API de Inteligencia Artificial**

La API de IA se utilizará como apoyo para construir o adaptar los itinerarios a partir de información previamente validada por la aplicación.

### Desarrollo y colaboración

- **Git**
- **GitHub**
- **Visual Studio Code**
- **Android Studio**
- **Postman** (opcional)

## Arquitectura general

```text
                     NearMe
                  Flutter / Dart
                        |
        +---------------+---------------+
        |               |               |
     Supabase      Google Maps       API de IA
        |          Google Places          |
        |               |                 |
   Usuarios          Lugares         Itinerarios
   Preferencias      Ubicación        Adaptación
   Reviews           Distancias       Recomendación
```

## Requisitos previos

Antes de iniciar el proyecto se recomienda tener instalado:

1. Git
2. Visual Studio Code
3. Flutter SDK
4. Android Studio
5. Google Chrome

Flutter incluye Dart, por lo que no es necesario instalar Dart por separado.

## Verificar el entorno

Ejecutar:

```bash
flutter --version
dart --version
git --version
flutter doctor
```

`flutter doctor` mostrará los componentes pendientes de configurar.

Se recomienda resolver los errores relacionados con:

- Flutter SDK
- Android toolchain
- Android Studio
- Chrome
- Dispositivos disponibles

## Crear o clonar el proyecto

### Si el repositorio ya existe

```bash
git clone URL_DEL_REPOSITORIO
cd nearme
flutter pub get
```

### Si se está creando por primera vez

```bash
flutter create nearme
cd nearme
```

## Ejecutar la aplicación

### Web

```bash
flutter run -d chrome
```

### Android

Primero abrir un emulador desde Android Studio o conectar un dispositivo físico.

Después:

```bash
flutter devices
flutter run
```

También se puede seleccionar un dispositivo específico:

```bash
flutter run -d ID_DEL_DISPOSITIVO
```

## Dependencias

Las dependencias del proyecto se administran desde:

```text
pubspec.yaml
```

Después de modificar las dependencias:

```bash
flutter pub get
```

Posibles paquetes a utilizar durante el desarrollo:

- supabase_flutter
- geolocator
- google_maps_flutter
- http o dio
- provider, riverpod o bloc para manejo de estado

La selección definitiva se realizará de acuerdo con las necesidades del proyecto.

## Variables de entorno

Las credenciales y API Keys no deben almacenarse directamente en el código ni subirse al repositorio.

Ejemplo de variables que podría requerir el proyecto:

```env
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
GOOGLE_MAPS_API_KEY=
AI_API_KEY=
```

Se recomienda incluir un archivo de ejemplo:

```text
.env.example
```

y agregar el archivo real de credenciales a `.gitignore`.

Nunca publicar claves privadas en GitHub.

## Estructura sugerida

```text
nearme/
|
|-- android/
|-- ios/
|-- web/
|-- assets/
|-- lib/
|   |
|   |-- core/
|   |-- models/
|   |-- services/
|   |-- repositories/
|   |-- screens/
|   |-- widgets/
|   |-- features/
|   |   |
|   |   |-- auth/
|   |   |-- profile/
|   |   |-- places/
|   |   |-- itinerary/
|   |   `-- reviews/
|   |
|   `-- main.dart
|
|-- test/
|-- .gitignore
|-- pubspec.yaml
`-- README.md
```

La estructura puede modificarse conforme evolucione el proyecto.

## Flujo principal esperado

```text
Inicio
  |
Registro / Login
  |
Preferencias del usuario
  |
Ubicación actual
  |
Tiempo disponible
  |
Distancia máxima
  |
Consulta de lugares
  |
Generación del itinerario
  |
Visualización en mapa
  |
Realización del recorrido
  |
Valoración
  |
Mejora de futuras recomendaciones
```

## Recomendaciones colaborativas

NearMe busca aprovechar las experiencias de sus usuarios.

En el MVP no se pretende entrenar un modelo complejo de Machine Learning. La primera implementación puede comparar:

- Intereses en común.
- Categorías favoritas.
- Valoraciones.
- Itinerarios completados.
- Puntuación general del recorrido.

Si un itinerario tiene buenas valoraciones entre usuarios con preferencias similares, puede recibir mayor prioridad al generar una nueva recomendación.

## Recalculo del itinerario

Una de las características diferenciadoras del proyecto será permitir actualizar el recorrido cuando las condiciones del usuario hayan cambiado.

Por ejemplo:

```text
Itinerario original:
Museo -> Parque -> Restaurante -> Mirador
```

Si el usuario permanece más tiempo del esperado en el museo, podrá solicitar una actualización.

NearMe utilizará:

- Hora actual.
- Tiempo restante.
- Ubicación actual.
- Lugares ya visitados.
- Distancia a los lugares pendientes.

Con esta información se generará una nueva propuesta de recorrido.

Durante el MVP esta actualización puede realizarse mediante una acción manual del usuario para evitar la complejidad del monitoreo permanente en segundo plano.

## Base de datos inicial

Entidades sugeridas:

```text
User
Preference
Place
Itinerary
ItineraryPlace
Review
```

Relaciones aproximadas:

```text
User
 |-- Preferences
 |-- Itineraries
 `-- Reviews

Itinerary
 |-- User
 |-- Places
 `-- Reviews
```

El modelo definitivo será documentado mediante un diagrama entidad-relación.

## Flujo de trabajo con Git

Se recomienda evitar trabajar directamente sobre `main`.

Ejemplo:

```bash
git checkout -b feature/login
```

Realizar cambios:

```bash
git add .
git commit -m "feat: add login screen"
git push origin feature/login
```

Después se crea un Pull Request en GitHub.

### Convención sugerida de commits

```text
feat: nueva funcionalidad
fix: corrección de error
docs: documentación
refactor: reorganización del código
test: pruebas
chore: configuración o mantenimiento
```

Ejemplos:

```text
feat: add user preferences
feat: generate itinerary
fix: correct location permissions
docs: update project setup
```

## Buenas prácticas

- No subir credenciales al repositorio.
- Mantener las funcionalidades separadas por módulos.
- Crear componentes reutilizables.
- Evitar lógica compleja directamente dentro de las pantallas.
- Validar datos recibidos desde APIs externas.
- Manejar errores de conexión.
- Mostrar estados de carga.
- Mantener commits pequeños y descriptivos.
- Documentar decisiones importantes.
- Priorizar un MVP funcional sobre una gran cantidad de características incompletas.

## Prioridades de desarrollo

### Fase 1 — Configuración

- Crear repositorio.
- Configurar Flutter.
- Configurar proyecto.
- Definir estructura.
- Configurar Supabase.

### Fase 2 — Usuarios

- Registro.
- Login.
- Perfil.
- Preferencias.

### Fase 3 — Ubicación y lugares

- Permisos de ubicación.
- Obtener coordenadas.
- Integrar mapa.
- Consultar lugares cercanos.

### Fase 4 — Itinerarios

- Definir tiempo disponible.
- Definir distancia máxima.
- Seleccionar lugares candidatos.
- Generar itinerario.
- Mostrar recorrido.

### Fase 5 — Comunidad

- Valoraciones.
- Historial.
- Recomendaciones basadas en preferencias similares.

### Fase 6 — Adaptación

- Detectar información actual del recorrido.
- Calcular tiempo restante.
- Recalcular itinerario bajo solicitud del usuario.

### Fase 7 — Cierre académico

- Pruebas.
- Corrección de errores.
- Documentación.
- Presentación.
- Demo final.

## Consideraciones académicas

NearMe es un proyecto universitario y su desarrollo está orientado principalmente a demostrar:

- Desarrollo multiplataforma.
- Arquitectura de software.
- Integración con servicios globales.
- Consumo de APIs.
- Persistencia de información.
- Autenticación.
- Geolocalización.
- Uso responsable de Inteligencia Artificial.
- Trabajo colaborativo mediante Git.

El objetivo no es competir directamente con plataformas comerciales existentes, sino construir un prototipo funcional que permita validar la propuesta y aplicar los conocimientos adquiridos durante el curso.

## Estado del proyecto

```text
Estado: En desarrollo
Tipo: Proyecto universitario
Curso: Aplicaciones Globales
Producto: MVP
```

## Nombre

**NearMe**

> Descubre más, planifica menos.
