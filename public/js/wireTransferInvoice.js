
//환율 적용쓰
exports.getData = function(setting, input){

    return dd = {
        pageMargins: [ 30, 30, 30, 30 ],
        
        content: [
        {
          columns: [
            {
                image: input.logo,
                width: 180,
                height: 50
            },
            {
              width: '*',
              text: setting.companyAddress,
              fontSize: 9,
              alignment: 'right'
              
            }
          ]
        },
        {
          text: '\nPayment Notice\n\n',
          style: 'header'
        },
        
        {
          text: 'Customer Information\n\n',
          style: 'subheader'
        },
        {
          columns: [
            {
              width: 180,
              text: 'Autoinspec.com Member ID: \n',
              bold: true,
              fontSize: 11
            },
            {
              width: '*',
              text: input.email,
              fontSize: 11
            },
            {
              width: '*',
              text: ''
            },
            {
              width: 90,
              text: ''
            }
          ]
        },
        {
          columns: [
            {
              width: 170,
              text: 'Customer Name: \n',
              bold: true,
              fontSize: 11
            },
            {
              width: '*',
              text: input.remitterName
            },
            {
              width: 130,
              text: 'Invoice No. : ',
              bold: true
            },
            {
              width: '*',
              text: input.invoiceNo,
              fontSize: 11
            }
          ]
        },
        {
          columns: [
            {
              width: 170,
              text: 'Customer Address: \n\n',
              bold: true
            },
            {
              width: '*',
              text: input.country
            },
            {
                width: 130,
              text: 'Invoice Date : ',
              bold: true
            },
            {
              width: '*',
              text: input.createdAt,
              fontSize: 11
            }
          ]
        },
        {
          style: 'tableExample',
          table: {
            widths: [85, 100, 30, 60, 85, 40, 70],
            body: [
              [{text: 'Product Name', style: 'tableHeader'}, {text: 'Order ID', style: 'tableHeader'}, 
                {text: 'Period', style: 'tableHeader'}, {text: 'Service Fee', style: 'tableHeader'}, 
                {text: 'GST/VAT Tax Rate', style: 'tableHeader'}, {text: 'Tax Fee', style: 'tableHeader'}, 
                {text: 'Invoice Amount', style: 'tableHeader'}],
                [{text: input.type, style: 'tableHeader'}, {text: input.invoiceNo, style: 'tableHeader'}, 
              {text: input.months, style: 'tableHeader'}, {text: input.price, style: 'tableHeader'}, {text: '0', style: 'tableHeader'}, 
              {text: '0', style: 'tableHeader'}, {text: input.price, style: 'tableHeader'}]
            ]
          }
        },
        {
          style: 'tableExample',
          table: {
            widths: [233, 60, 85, 40, 70],
            body: [
                [{text: 'Total', style: 'tableHeader'}, {text: input.price, style: 'tableHeader'}, {text: '0', style: 'tableHeader'},
                {text: '0', style: 'tableHeader'},{text: input.price, style: 'tableHeader'}],
              
            ]
          }
        },
        {
          text: 'Payment Method\n\n',
          style: 'subheader'
        },
        {
          columns: [
            {
                width: 125,
                text: 'By Telegraphic Transfer\n\n',
                  style: 'small'
            },
            {
              width: '*',
              text: 'Please transfer the funds and quote Order ID, net of bank charges to the following bank accounts:',
              fontSize: 9.5
            }
          ]
        },
        {
          columns: [
            {
                width: 125,
                text: '',
                style: 'small',
                fontSize: 11
            },
            {
              width: 140,
              text: 'In favour of ',
              fontSize: 11
            },
            {
              width: '*',
              text: setting.beneficiary,
              fontSize: 11
            }
          ]
        },
        {
          columns: [
            {
                width: 125,
                text: '',
                  style: 'small'
            },
            {
              width: 140,
              text: 'Account No.: ',
              fontSize: 11
            },
            {
              width: '*',
              text: setting.accountNo,
              fontSize: 11
            }
          ]
        },
        {
          columns: [
            {
                width: 125,
                text: '',
                  style: 'small'
            },
            {
              width: 140,
              text: 'SWIFT Code: ',
              fontSize: 11
            },
            {
              width: '*',
              text: setting.swiftCode,
              fontSize: 11
            }
          ]
        },
        {
          columns: [
            {
                width: 125,
                text: '',
                  style: 'small'
            },
            {
              width: 140,
              text: 'Bank Name: ',
              fontSize: 11
            },
            {
              width: '*',
              text: setting.bank,
              fontSize: 11
            }
          ]
        },
        {
          columns: [
            {
                width: 125,
                text: '',
                style: 'small'
            },
            {
              width: 140,
              text: 'Bank Address:  ',
              fontSize: 11
            },
            {
              width: '*',
              text: setting.bankAddress,
              fontSize: 11
            }
          ]
        },
        {
          columns: [
            {
                width: 125,
                text: '',
                style: 'small'
            },
            {
              width: 140,
              text: 'Others Beneficiary Telephone:   ',
              fontSize: 11
            },
            {
              width: '*',
              text: setting.othersBeneficiaryTel,
              fontSize: 11
            }
          ]
        },
        {
          columns: [
            {
                width: 125,
                text: '',
                style: 'small'
            },
            {
              width: 140,
              text: 'Beneficiary Address:   ',
              fontSize: 11
            },
            {
              width: '*',
              text: setting.beneficiaryAddress,
              fontSize: 11
            }
          ]
        },
        {
          columns: [
            {
                width: 125,
                text: '',
                style: 'small'
            },
            {
              width: 140,
              text: 'Branch of Bank:   ',
              fontSize: 11
            },
            {
              width: '*',
              text: setting.branchOfBank + '\n',
              fontSize: 11
            }
          ]
        },
        {
          text: 'Note:\n',
        },
        {
          columns: [
            {
                width: 25,
                text: '1.',
                  style: 'small'
            },
            {
              width: '*',
              text: setting.note1,
              fontSize: 9.5
            }
          ]
        },
        {
          columns: [
            {
                width: 25,
                text: '2.',
                  style: 'small'
            },
            {
              width: '*',
              text: setting.note2,
              fontSize: 9.5
            }
          ]
        },
        {
          columns: [
            {
                width: 25,
                text: '3.',
                  style: 'small'
            },
            {
              width: '*',
              text: setting.note3,
              fontSize: 9.5
            }
          ]
        },
        {
          columns: [
            {
                width: 25,
                text: '4.',
                  style: 'small'
            },
            {
              width: '*',
              text: setting.note4,
              fontSize: 9.5
            }
          ]
        },
        {
          columns: [
            {
                width: 25,
                text: '5.',
                  style: 'small'
            },
            {
              width: '*',
              text: setting.note5,
              fontSize: 9.5
            }
          ]
        },
      ],
      styles: {
        header: {
          fontSize: 17,
          bold: true,
          alignment: 'center'
        },
        subheader: {
          fontSize: 12,
          bold: true,
          decoration: 'underline'
          
        },
          subheader2: {
          fontSize: 14,
          bold: true,
          decoration: 'underline',
          margin: [30, 0, 0, 2]
        },
        quote: {
          italics: true
        },
        small: {
          fontSize: 10,
          margin: [8, 0, 0, 0]
        },
        tableExample: {
          margin: [0, 5, 0, 15],
          alignment: 'center'
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: 'black'
        }
      }
      
    }
    
  };