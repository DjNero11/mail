document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  //Mine: on email sent
  document.querySelector('#compose-form').onsubmit = () => {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(result => {
        // Mine: Print result
        console.log(result);
        load_mailbox('sent');
    });
    // Mine: Prevent default submission
    return false;
  };

});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    //Mine:: 
    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {

    console.log(emails);
    //Mine: Print emails
    emails.forEach(element => {
        const sender = element.sender;
        const subject = element.subject;
        const timestamp = element.timestamp;

        const div = document.createElement('div');
        div.style.border = 'solid';
        div.style.margin = '10px';
        div.style.padding = '10px';
        div.style.cursor = 'pointer';
        div.innerHTML = `<b>${sender}</b>    ${subject}  <span class='timestamp'>  ${timestamp} </span>  <button type='button' name="${element.id}" class="archive">Archive</button>` // https://www.w3schools.com/tags/tag_b.asp
        div.addEventListener('click',() => email_view(element.id));
        document.querySelector('#emails-view').append(div);
        div.querySelector('.archive').style.float = 'right';
        div.querySelector('.timestamp').style.float = 'right';
        if (element.read === true) {
            div.style.background = '#B0B0B0';
        }
        else {
            div.style.background = 'white';
        }
        }); 

        const archiveButtons = document.querySelectorAll('.archive');
        archiveButtons.forEach(button => {
            if (mailbox === "inbox"){
                button.value = 'archive'
                }
            if (mailbox === "sent"){
                button.style.display='none';
                }
            if (mailbox === "archive"){
                button.innerHTML = 'Unarchive'
                button.value = 'unarchive'
            }

            button.addEventListener('click', function(event) {
                if (button.value === "archive"){
                    console.log(`${button.name}`)
                    fetch(`/emails/${button.name}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            archived: true
                        })
                    })
                    .then( () => {
                        load_mailbox('inbox');
                    });
                }
                if (button.value === "unarchive") {
                    console.log(`${button.name}`)
                    fetch(`/emails/${button.name}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            archived: false
                        })
                    })
                    .then( () => {
                        load_mailbox('inbox');
                    });
                }
                
                //https://www.w3schools.com/jsref/event_stoppropagation.asp
                event.stopPropagation();  
            });
        });

    });
}

//Mine::
function email_view(id) {
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email').style.display = 'block';
    
    //Mine: remove children of #email:
    const email_remove = document.getElementById('email');
    while (email_remove.firstChild) {
        email_remove.removeChild(email_remove.firstChild);
    }
    fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
        console.log(email);
        //Mine: Show:
        const div_sender = document.createElement('div');
        const div_subject = document.createElement('div');
        const div_timestamp = document.createElement('div');
        const div_body = document.createElement('div');
        
        div_sender.innerHTML = `<b>Sender:</b> ${email.sender}`
        div_subject.innerHTML = `<b>Subject:</b>${email.subject}`
        div_timestamp.innerHTML = `<b>Timestamp:</b>${email.timestamp}`
        div_body.innerHTML = `<b>Body:</b> <br> ${email.body}`
        const recipients_text = document.createElement('div');
        document.querySelector('#email').append(div_sender,recipients_text);
        recipients_text.innerHTML = '<b>Recipients:</b>'
        email.recipients.forEach(element => {
            const div_element = document.createElement('div');
            div_element.innerHTML = `${element}`;
            document.querySelector('#email').append(div_element);
        })
        document.querySelector('#email').append(div_subject, div_timestamp, div_body);
        //Mine: reply button
        const reply = document.createElement('button');
        reply.innerHTML = 'reply'
        reply.value = email.id
        reply.className = 'btn btn-sm btn-outline-primary';
        document.querySelector('#email').append(reply);
        reply.addEventListener('click', function(){
            compose_email();

            //Mine: Composition fields
            document.querySelector('#compose-recipients').value = `${email.sender}`;
            if (email.subject[0]==="R" && email.subject[1]==="e" && email.subject[2]===":"){
                document.querySelector('#compose-subject').value = `${email.subject}`;
            }
            else {
                document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
            }
            document.querySelector('#compose-body').value = `\n\n On ${email.timestamp} ${email.sender} wrote: \n\n ${email.body}`;
        });
        //Mine: Mark as read:
        fetch(`/emails/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                read: true
            })
          })

    });

}