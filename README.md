# Vyasa Analytics Demo
The demo project showcases features available from the Vyasa API.  You can learn more about the Vyasa API [here](https://vyasa.com/solutions/layar-api/).  Documentation for API endpoints is located [here](https://api.vyasa.com/layar/swagger-ui.html).

## Live Demo
This demo project is running live at https://vyasa.com/demo/

## Running The Demo Yourself
The demo project is a web application built using Google's Angular framework.

### Authentication
You'll need a client id  and secret to make requests of the Vyasa API.  You can obtain these values by creating a Vyasa API account [here](https://api.vyasa.com).  Simply register for an account, or log into an existing account, and click the **Generate New API Access Keys** button.  Once you have a client id and secret, you'll need to modify the [environment.ts](./src/environments/environment.ts) file, setting your client id and secret for the `oauthClientId` and `oauthClientSecret` variables.

```
export const environment = {
    ...
    oauthClientId: '__CLIENT_ID__',            // your client id here
    oauthClientSecret: '__CLIENT_SECRET__',    // your secret here
};
```
  
### Install Dependencies and Start The Application
At this point, you can use `npm` to install dependencies and start the application.  Once the application has launched, navigate to [localhost:4200](http://localhost:4200) to view the demo application.
```
npm install
npm start
```

## Example Components
We've created a number of example components, located in the [example folder](./example).  Here you'll find a component dedicated to each of the main features being showcased in the demo project.  You'll also find the [LayarService](./example/layar.service.ts), which is where you can find examples of the specific API requests that the example components are making.
<br/><br/>

## What's Next?
The license for this project is located [here](./LICENSE).  Feel free to modify and extend this demo application or build your own!  You can reach us with any questions at hello@vyasa.com.
