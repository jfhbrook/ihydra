import PropTypes from "prop-types";
import React from "react";
import * as reactTabs from "react-tabs";

import css from "./index.css";

export function Tabs({ children }) {
  return (
    <div className={css.tabs}>
      <reactTabs.Tabs>{children}</reactTabs.Tabs>
    </div>
  );
}

Tabs.tabsRole = "Tabs";

export function TabList({ children }) {
  return <reactTabs.TabList>{children}</reactTabs.TabList>;
}

TabList.tabsRole = "TabList";

export function Tab({ children }) {
  return <reactTabs.Tab>{children}</reactTabs.Tab>;
}

Tab.tabsRole = "Tab";

export function TabPanel({ children, ...panelProps }) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <reactTabs.TabPanel {...panelProps}>{children}</reactTabs.TabPanel>;
}

TabPanel.tabsRole = "TabPanel";
