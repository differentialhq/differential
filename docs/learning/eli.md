# Explain like I'm

## A distributed systems expert

- Framework Nature: Differential is a Service Orchestration Framework, focusing on easing the transition from monolithic codebases to a service-oriented architecture.

- Monolithic Development, Distributed Deployment: Enables writing code in a monolithic style while facilitating deployment as distributed, independent services.

- Functional Service Definition: Services are defined as collections of functions, abstracting away the typical complexities of defining and managing network-level service contracts.

- Type Safety and Code Co-location: All services coexist within the same codebase, allowing shared code and types, ensuring type-safe inter-service communication.

- Runtime Service Orchestration: Provides mechanisms (d.start(), d.stop()) for dynamic service management, enabling runtime flexibility in service deployment and scalability.

- Centralized Control Plane: Implements a control plane for service registry, health monitoring, and as a service bus, centralizing cross-cutting concerns (authentication, authorization, rate limiting, observability).

- Transparent Inter-Service Communication: Facilitates calling functions across services transparently, similar to local function invocations, abstracting the underlying network communication.

- First-Class TypeScript Support: Leveraging TypeScript's type system for type-safe interactions and reducing runtime errors, enhancing developer productivity.

- Opinionated Trade-offs: Emphasizes certain trade-offs (e.g., centralized control plane vs decentralized discovery) to streamline development and maintenance of distributed services.

## A commercial software developer

- Service Orchestration Framework: Differential is a framework designed to simplify turning functions into services, akin to how frameworks like Express.js streamline web server creation.

- Monolithic Code, Distributed Deployment: You can write code as if it were a monolith (similar to a single Node.js app) but deploy it as separate, scalable services, much like Docker containers in a microservices architecture. Differential is deployment-agnostic, so you can deploy to a single server, multiple servers, or a serverless environment.

- Services as Function Collections: Define services as groups of functions (resembling AWS Lambda), focusing on business logic without the overhead of traditional service contracts. These services exist as a single codebase, allowing shared code and types.

- Shared Codebase, Type Safety: All services are in one codebase (think monorepo style, like with Yarn Workspaces), ensuring shared code and type consistency across services.

- Dynamic Service Lifecycle: Services can be dynamically started and stopped at runtime (similar to starting/stopping Docker containers) using simple d.start() and d.stop() methods.

- Central Control Plane: Functions as a service registry and bus, like a combination of Eureka for service discovery and Kafka for message passing, centralizing service management.

- Transparent Inter-Service Communication: Allows function calls between services without worrying about network details, much like calling a local function, simplifying the typical REST or gRPC communication patterns.

- Simplifies Service-Oriented Architecture: Aims to lower the barrier and cost of running a service-oriented architecture, addressing common challenges you might face with traditional microservices frameworks. (It's not FaaS)

## A high school student with some programming experience

- Framework for Building Web Services: Differential is a tool that helps developers turn parts of their code into web services easily. It's like how frameworks like Flask or Express help you build web applications, but for creating services.

- Write Once, Deploy Many: You can write your code in one big piece (like a single project or app), but when you're ready to run it, Differential lets you break it into smaller, independent parts (services). This is a bit like building a big project for a class and then breaking it into smaller, more manageable pieces for presentation.

- Services Are Just Functions: In Differential, services are made up of functions (like the functions you write in Python or JavaScript). There's no need for complex setups or configurations – it's about focusing on the code that does the work.

- Shared Codebase: All your services live in the same project (think of it as one big folder with all your code). This makes it easier to share code and ensures everything works well together, similar to how you might structure a final year project with different modules.

- Easy to Start and Stop Services: Just like you can start a local server for a web app, Differential allows you to easily start or stop these services with simple commands.

- Central Hub for Managing Services: There's a central place that keeps track of all your different services, much like how a project dashboard might show you different components of your project and their status.

- Easy Communication Between Services: Services can talk to each other very easily, without needing to know complex details about where they are or how they're connected. It's like calling a function in one part of your code from another part, but these parts can be running separately.

- Great for TypeScript Users: If you've used TypeScript, Differential is designed to work really well with it, making sure your code is correct and doing what it's supposed to do.

## A five-year-old

- Special Lego Rules: Think of Differential like a special set of rules for playing with LEGOs. You can build many different things like cars, houses, or spaceships using the same LEGO blocks, but each one is its own cool toy.

- Building Big Toys in Pieces: It's like when you build a big toy, but you can take apart different pieces and they still work like smaller toys. You can mix and match parts to make new toys!

- Magic Box for Toys: Imagine you have a magic box where you put your LEGO toys. The box helps you find the right pieces and tells them how to work together, so your toys always turn out great.

- Easy to Change Toys: If you want to change a part of your toy, like putting a new wheel on a car or adding a window to a house, it's super easy. The magic box helps you do it without having to rebuild the whole toy.

- Playing with Others: If your friends have toys made with the same magic box, all of your toys can talk to each other and play together, making fun new games.

- Special Toy Language: The magic box is really good at understanding a special toy language, making sure that all your toys understand each other perfectly.

- Making Toy Building Fun: This magic box makes building complicated toys as fun and easy as playing with your simplest LEGO sets, so you can make amazing things without getting frustrated.