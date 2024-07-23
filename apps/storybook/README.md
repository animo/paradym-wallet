<div align="center">
   <img src="assets/icon.png" alt="Animo Logo" height="176px" />
</div>

<h1 align="center"><b>Storybook</b></h1>

Storybook app that works in Web and Native for developing UI.

## Running

To run the storybook on web, you can run the `web` command. This will allow you to develop using `react-native-web`, meaning you don't have to run the components on-device.

```sh
pnpm web
```

To run storybook on a device, run the app, start the expo server, and start storybook:

```sh
pnpm ios --device
pnpm start
```

And in another window run:

```sh
pnpm 

If you add new stories on the native (`.ondevice` version) you either need to have the watcher running or run the stories loader. To update the stories one time

```sh
pnpm storybook:generate
```

> TODO: document how you can have react-native only stories. Some stories may depend on native dependencies. I think you can do `.native.` stories, but haven't tested this.

