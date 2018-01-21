import React from 'react';
import { Link } from 'react-router-dom';
import Maturity from './Maturity';
import AmountSlider from './AmountSlider';
import MaturitySlider from './MaturitySlider';

class Nav extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      collapsed: true,
	  minAllocation: [25000,20000,15000],
 	  cashReducer: ['Yes', 'No']
    }
    this.toggleNavbar = this.toggleNavbar.bind(this);
	this.onMinAllocChange = this.onMinAllocChange.bind(this);
	this.onCashReducerChange = this.onCashReducerChange.bind(this);
  }

  onMinAllocChange = (e) => {
	this.props.handleMinAllocChange(e.target.value);
  }

  onCashReducerChange = (e) => {
	this.props.handleCashReducerChange(e.target.value);
  }

  toggleNavbar(){
    this.setState({
      collapsed: !this.state.collapsed
    })
  }

  render() {

    const collapsed = this.state.collapsed;
    const classOne = collapsed ? 'collapse navbar-collapse' : 'collapse navbar-collapse show';
    const classTwo = collapsed ? 'navbar-toggle navbar-toggle-right collapsed' : 'navbar-toggle navbar-togler-right';
	const minAllocation = this.state.minAllocation;
	const cashReducer = this.state.cashReducer;

	  return (
      <div>
        <nav className="navbar navbar-default navbar-custom navbar-fixed-top">
          <div className="container-fluid">
            <div className="row">

              <div className='col-sm-1'>
                <div className="navbar-header">
                    <button  onClick={ this.toggleNavbar } className={ `${classTwo}` } type="button" data-toggle="collapse" data-target="#navbarResponsive">
                      <span className="icon-bar" />
                      <span className="icon-bar" />
                      <span className="icon-bar" />
                    </button>
                    <h4 style={{ marginLeft: '7px' }}><b><span style={{ fontSize: '22' }}>M</span>UNI <span style={{ fontSize: '22' }}>L</span>ADDER <span style={{ fontSize: '22' }}>A</span>LLOCATION</b></h4>
                </div>
              </div>

              <div className={ `${ classOne }` } id="navbarResponsive">
                <div className="col-sm-2" style={{ paddingLeft: '5%'}}>
                <p><b>Minimum Allocation</b></p>
                  <select style={{ width: '55%', display:'inline' }} className='form-control' onChange = { this.onMinAllocChange }>
            { minAllocation.map( ( minAlloc, idx ) => (
                    <option key = { idx } value = { minAlloc }>{ minAlloc }</option>
            ))}
                  </select>
                </div>
                <div className="col-sm-5">
                    <MaturitySlider filterMaturity = { this.props.filterMaturity }/>
                </div>

                <div className="col-sm-4">
                  	<AmountSlider setLadder = { this.props.setLadder }/>
                </div>
              </div>

            </div>
          </div>
        </nav>
      </div>

    );
  }
}


export default Nav;
