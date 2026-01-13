import sweetAlert from 'sweetalert';
import defaults from './defaults';
import Storage from '../storage';

function bindResetButton() {
  const button = document.getElementById("reset");
  button.onclick = (e) => {
    e.preventDefault();

    sweetAlert({
      title: "Are you sure?",
      text: "You will not be able to recover your custom settings",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, reset!",
      closeOnConfirm: false
    }, async () => {
      const options = {};
      options.theme = defaults.theme;
      options.addons = JSON.stringify(defaults.addons);
      options.structure = JSON.stringify(defaults.structure);
      options.style = defaults.style;

      await Storage.save(options);
      document.location.reload();
    });
  }
}

export default bindResetButton;
