import PropTypes from "prop-types";
import React from "react";

import Button from "../Button";
import Panel from "../Panel";
import PanelMessage from "../PanelMessage";
import ButtonBar from "../ButtonBar";
import UI from "../UI";

import css from "./index.css";

export default function Alert({ icon, message, buttons }) {
  return (
    <UI>
      <Panel>
        <PanelMessage icon={icon}>{message}</PanelMessage>
      </Panel>
      <ButtonBar>
        {Object.entries(buttons).map(([label, { icon, onClick }]) => (
          <Button key={label} icon={icon} onClick={onClick}>
            {label}
          </Button>
        ))}
      </ButtonBar>
    </UI>
  );
}

Alert.propTypes = {
  buttons: PropTypes.objectOf(
    PropTypes.shape({
      onClick: PropTypes.func.isRequired,
      icon: PropTypes.object
    })
  ).isRequired
};
