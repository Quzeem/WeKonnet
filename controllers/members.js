const { EventEmitter } = require('events');
const generator = require('generate-password');
const csv = require('fast-csv');
const webpush = require('web-push');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');
const Member = require('../models/Member');
const Organization = require('../models/Organization');
const sendToken = require('../utils/sendToken');
const {
  sendPasswordResetLink,
  changePassword,
} = require('../utils/passwordReset');
const { uploadAvatar } = require('../utils/avatar');
const sendEmail = require('../utils/sendEmail');
const search = require('../utils/search');

/**
 * @description Get all members
 * @route GET /api/v1/organizations/:organizationId/members
 * @access Private (organization & members)
 */
exports.getMembers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

/**
 * @description Get a member
 * @route GET /api/v1/organizations/:organizationId/members/:memberId
 * @access Private (organization & members)
 */
exports.getMember = asyncHandler(async (req, res, next) => {
  const member = await Member.findOne({
    _id: req.params.memberId,
    organizations: { $in: [req.params.organizationId] },
  });

  if (!member) {
    return next(
      new ErrorResponse(`Member with the ID: ${req.params.memberId} not found`),
      404
    );
  }

  return res.status(200).json({
    success: true,
    data: member,
  });
});

/**
 * @description Add a new member
 * @route POST /api/v1/organizations/:organizationId/members
 * @access Private (organization)
 */
exports.createMember = asyncHandler(async (req, res, next) => {
  // Check if organization exists
  const organization = await Organization.findById(req.params.organizationId);

  if (!organization) {
    return next(
      new ErrorResponse(
        `Organization with the ID: ${req.params.organizationId} not found`
      ),
      404
    );
  }

  try {
    req.body.organizations = [req.params.organizationId];

    // default password
    if (!req.body.password) {
      req.body.password = generator.generate({ length: 10, numbers: true });
    }

    const member = await Member.create(req.body);

    // Send login credentials via SMS

    return res.status(201).json({
      success: true,
      data: member,
    });
  } catch (err) {
    if (err.code === 11000) {
      const member = await Member.findOne({
        phone: req.body.phone,
        organizations: req.params.organizationId,
      });

      // allow an existing member to be added by a new organization with the same phone number
      if (!member) {
        const updatedMember = await Member.findOneAndUpdate(
          { phone: req.body.phone },
          { $addToSet: { organizations: req.params.organizationId } },
          { new: true }
        );

        if (!updatedMember) {
          return next(
            new ErrorResponse(
              `Member with the phone ${req.body.phone} not found`
            ),
            404
          );
        }

        return res.status(200).json({
          success: true,
          message: `Exisitng member with the ID: ${updatedMember._id} has been added to ${organization.name}`,
        });
      }

      return next(
        new ErrorResponse(
          'The phone number provided has already been used to register a member in this organization',
          400
        )
      );
    }
    return next(err);
  }
});

/**
 * @description Bulk registrastion of members with a csv file
 * @route POST /api/v1/organizations/:organizationId/members/csv/upload
 * @access Private (organization)
 */
exports.registerMembersWithCSV = asyncHandler(async (req, res, next) => {
  // Check if organization exists
  const organization = await Organization.findById(req.params.organizationId);

  if (!organization) {
    return next(
      new ErrorResponse(
        `Organization with the ID: ${req.params.organizationId} not found`
      ),
      404
    );
  }

  if (!req.file) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  const membersFile = req.file;

  const members = [];

  const options = {
    headers: true,
    discardUnmappedColumns: true,
    quote: null,
    ignoreEmpty: true,
    trim: true,
  };

  try {
    csv
      .parseString(membersFile.buffer.toString(), options)
      .on('data', (memberStream) => {
        const memberObject = memberStream;
        memberObject.organizations = [req.params.organizationId];
        memberObject.password = generator.generate({
          length: 10,
          numbers: true,
        });
        members.push(memberObject);
      })
      .on('end', async () => {
        const totalProcessCounter = members.length;
        let currentProcessCount = 0;

        // Create an instance(object) from EventEmitter
        const emitter = new EventEmitter();

        emitter.on('done', async () => {
          if (totalProcessCounter === currentProcessCount) {
            res
              .status(201)
              .json({ success: true, message: 'Members successfully added.' });
          }
        });

        // forEach starts here
        members.forEach(async (member) => {
          try {
            await Member.create(member);
            // Send login credentials via SMS
            ++currentProcessCount;
            return emitter.emit('done');
          } catch (err) {
            if (err.code === 11000) {
              const memberDoc = await Member.findOne({
                phone: member.phone,
                organizations: req.params.organizationId,
              });

              // allow an existing member to be added by a new organization with the same phone number
              if (!memberDoc) {
                await Member.findOneAndUpdate(
                  { phone: member.phone },
                  { $addToSet: { organizations: req.params.organizationId } },
                  { new: true }
                );
                // Send notification email to the existing members
                ++currentProcessCount;
                return emitter.emit('done');
              }

              // same organization trying to member(s) with existing phone(s).
              ++currentProcessCount;
              return emitter.emit('done');
            }

            return next(err);
          }
        });
        // forEach ends here
      });
  } catch (err) {
    return next(new ErrorResponse('Something went wrong', 500));
  }
});

/**
 * @description Delete member
 * @route DELETE /api/v1/members/:memberId?organizationId=
 * @access Private (organization)
 */
exports.deleteMember = asyncHandler(async (req, res, next) => {
  const member = await Member.findByIdAndUpdate(
    req.params.memberId,
    {
      $pull: { organizations: req.query.organizationId },
    },
    { new: true }
  );

  if (!member) {
    return next(
      new ErrorResponse(`Member with the ID: ${req.params.memberId} not found`),
      404
    );
  }

  if (member.organizations.length === 0) {
    await member.remove();
  }

  return res.status(200).json({
    success: true,
    data: {},
  });
});

/**
 * @description Get logged in member
 * @route GET /api/v1/members/me
 * @access Private (member)
 */
exports.getLoggedInMember = asyncHandler(async (req, res, next) => {
  const member = await Member.findById(req.user._id);
  return res.status(200).json({ success: true, data: member });
});

/**
 * @description Details update for logged in member
 * @route PUT /api/v1/members/updatedetails
 * @access Private (member)
 */
exports.updateMemberDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    phone: req.body.phone,
    dateOfBirth: req.body.dateOfBirth,
    professionalSkills: req.body.professionalSkills,
    gender: req.body.gender,
    stateOfOrigin: req.body.stateOfOrigin,
    location: req.body.location,
  };

  const member = await Member.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  return res.status(200).json({ success: true, data: member });
});

/**
 * @description Password update for logged in member
 * @route PUT /api/v1/members/updatepassword
 * @access Private (member)
 */
exports.updateMemberPassword = asyncHandler(async (req, res, next) => {
  const member = await Member.findById(req.user._id);

  // Check current password
  if (!(await member.verifyPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Incorrect password', 401));
  }

  // else
  member.password = req.body.newPassword;
  await member.save();

  return sendToken(member, 200, res);
});

/**
 * @description Forgot password
 * @route POST /api/v1/members/forgotpassword
 * @access Public (member)
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  sendPasswordResetLink(Member, req, res, next);
});

/**
 * @description Reset password
 * @route PUT /api/v1/members/resetpassword/:resettoken
 * @access Public (member)
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
  changePassword(Member, req, res, next);
});

/**
 * @description Avatar upload for member
 * @route POST /api/v1/members/avatar
 * @access Private (member)
 */
exports.uploadAvatar = asyncHandler(async (req, res, next) => {
  uploadAvatar(req, res, next);
});

/**
 * @description Message a member
 * @route POST /api/v1/members/message/single
 * @access Private (organization & member)
 */
exports.messageMember = asyncHandler(async (req, res, next) => {
  const { subject, text, email } = req.body;

  if (!subject || !text || !email) {
    return next(
      new ErrorResponse(
        'Please provide the message subject, text, and member email',
        400
      )
    );
  }

  try {
    let senderName;
    if (req.user.role === 'organization') {
      senderName = req.user.name;
    } else if (req.user.role === 'member') {
      senderName = `${req.user.firstname} ${req.user.lastname}`;
    }

    // sending email
    await sendEmail({
      sender: `${senderName} <${req.user.email}>`,
      receiver: req.body.email,
      subject: req.body.subject,
      body: req.body.text,
    });
    // send response
    return res.status(200).json({ success: true, message: 'Email sent' });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Email could not be sent' });
  }
});

/**
 * @description Message all members
 * @route POST /api/v1/members/message/all
 * @access Private (organization)
 */
exports.messageMembers = asyncHandler(async (req, res, next) => {
  const { subject, text } = req.body;

  if (!subject || !text) {
    return next(
      new ErrorResponse('Please provide the message subject and text', 400)
    );
  }
  // Get all members email
  const emails = await Member.find({ organizations: req.user._id }).distinct(
    'email'
  );

  if (emails.length === 0) {
    return next(new ErrorResponse('Members not found', 404));
  }

  try {
    // sending email
    await sendEmail({
      sender: `${req.user.name} <${req.user.email}>`,
      receiver: emails,
      subject: req.body.subject,
      body: req.body.text,
    });
    // send response
    return res.status(200).json({ success: true, message: 'Email sent' });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Email could not be sent' });
  }
});

/**
 * @description Search for members in a specific organization
 * @route GET /api/v1/members/search?name=job
 * @access Private
 */
exports.searchMembers = asyncHandler(async (req, res, next) => {
  search(req, res, next);
});
