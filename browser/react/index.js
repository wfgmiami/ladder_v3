import React, { Component } from 'react';
import { render } from 'react-dom';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { Provider } from 'react-redux';
// import SingleStock from './SingleStock';

import App from './App';

const root = document.getElementById('app');

const route = (
  <BrowserRouter>
    <Switch>
      <Route exact path="/" component={App} />
      <Route
        exact
        path="/api/quote/:symbol"
        render={router => (
          <App router={router} />
			)}
      />
    </Switch>
  </BrowserRouter>

);

render(route, root);
