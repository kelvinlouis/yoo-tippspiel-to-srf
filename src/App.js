import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import './App.css';
import Service from './Service';

class App extends Component {
  constructor(props) {
    super(props);

    this.service = new Service();
    this.state = {
      ranking: [],
    };
  }

  componentDidMount() {
      this.service.getRanking().then(ranking => this.setState({ ranking }));
  }

  render() {
    const { ranking } = this.state;

    return (
      <div className="App">
        <div className="container">
          <a href="http://wm18-yoo-web.azurewebsites.net" className="btn btn-link">
            Zurück zum offiziellen Tippspiel
          </a>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Punkte</th>
                <th>W</th>
                <th>D</th>
                <th>H</th>
                <th>A</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map(({ user, points, rank, winner, diff, home, away }) => (
                <tr key={user}>
                  <td>{rank}</td>
                  <td>{user}</td>
                  <td>{points}</td>
                  <td>{winner}</td>
                  <td>{diff}</td>
                  <td>{home}</td>
                  <td>{away}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default App;
